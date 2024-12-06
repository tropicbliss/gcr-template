import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import * as docker_build from "@pulumi/docker-build";

const enableResourceManager = new gcp.projects.Service(
    "EnableResourceManager",
    {
        service: "cloudresourcemanager.googleapis.com",
        disableOnDestroy: false
    },
);

const enableCompute = new gcp.projects.Service("EnableCompute", {
    service: "compute.googleapis.com",
    disableOnDestroy: false
}, { dependsOn: enableResourceManager });

const enableCloudRun = new gcp.projects.Service("EnableCloudRun", {
    service: "run.googleapis.com",
}, { dependsOn: enableCompute });

const location = gcp.config.region || "us-central1";

const repo = new gcp.artifactregistry.Repository("BackendGcrRepo", {
    location,
    format: "DOCKER",
    repositoryId: "backend",
    description: "Docker repository with cleanup policy",
    cleanupPolicies: [
        {
            id: "delete-old-artifacts",
            action: "DELETE",
            condition: {
                olderThan: "1210000s", // 14 days
            },
        },
    ],
}, { dependsOn: enableCompute });

const imageName = "js-app";

const fullImagePath = pulumi
    .interpolate`${repo.location}-docker.pkg.dev/${gcp.config.project}/${repo.repositoryId}/${imageName}:latest`

const myImage = new docker_build.Image(imageName, {
    push: true,
    tags: [fullImagePath],
    context: {
        location: "./app"
    },
    platforms: ["linux/amd64"],
    cacheFrom: [{
        registry: {
            ref: fullImagePath
        }
    }],
    cacheTo: [
        {
            inline: {}
        }
    ]
}, { dependsOn: enableCompute })

const ipAddress = new gcp.compute.GlobalAddress("LbIpAddress", {
    name: "lb-ip-address"
}, { dependsOn: enableCloudRun }) // remove this if you do not need custom domain

const config = new pulumi.Config();

const certificate = new gcp.compute.ManagedSslCertificate("SslCertificate", {
    name: "lb-cert",
    managed: {
        domains: [config.require("domain")]
    }
}, { dependsOn: enableCloudRun }) // remove this if you do not need custom domain

const jsService = new gcp.cloudrunv2.Service("js", {
    location,
    template: {
        containers: [
            {
                image: myImage.ref,
                ports: {
                    containerPort: 8080,
                },
            },
        ],
        scaling: {
            minInstanceCount: 1,
            maxInstanceCount: 3,
        },
    },
    deletionProtection: false,
    ingress: "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER",
}, { dependsOn: enableCloudRun });

const neg = new gcp.compute.RegionNetworkEndpointGroup("LbNeg", {
    name: "lb-neg",
    region: location,
    cloudRun: {
        service: jsService.name
    }
}, { dependsOn: enableCloudRun }) // remove this if you do not need custom domain

const securityPolicy = new gcp.compute.SecurityPolicy("LbSecurityPolicy", {
    name: "lb-security-policy", // default rule allowing all other traffic not caught by the previous policies
    rules: [
        {
            action: "allow",
            priority: 2147483647,
            match: {
                versionedExpr: "SRC_IPS_V1",
                config: {
                    srcIpRanges: ["*"],
                },
            },
        },
        {
            action: "throttle",
            priority: 2147483646, // lower priority number means higher priority so this gets executed first
            description: "Default rate limiting rule",
            match: {
                versionedExpr: "SRC_IPS_V1",
                config: {
                    srcIpRanges: ["*"],
                },
            },
            rateLimitOptions: {
                conformAction: "allow",
                enforceOnKey: "IP",
                exceedAction: "deny(429)",
                rateLimitThreshold: {
                    count: 500,
                    intervalSec: 60,
                }, // rate limit 500 requests/minute per IP
            },
        },
        {
            action: "throttle",
            priority: 2147483645, // lower priority number means higher priority so this gets executed first
            description: "Block Regions",
            match: {
                expr: {
                    expression: "origin.region_code in ['RU', 'SG']"
                }
            },
        },
    ],
}, { dependsOn: enableCloudRun }); // remove this if you do not need custom domain

const backendService = new gcp.compute.BackendService("LbBackend", {
    backends: [{
        group: neg.id,
    }],
    cdnPolicy: {
        cacheKeyPolicy: {
            includeHost: true,
            includeProtocol: true,
            includeQueryString: true
        },
        cacheMode: "CACHE_ALL_STATIC",
        clientTtl: 3600,
        defaultTtl: 3600,
        maxTtl: 86400,
        negativeCaching: false,
        serveWhileStale: 0
    },
    compressionMode: "DISABLED",
    connectionDrainingTimeoutSec: 0,
    enableCdn: true,
    loadBalancingScheme: "EXTERNAL_MANAGED",
    securityPolicy: securityPolicy.id,
    localityLbPolicy: "ROUND_ROBIN",
    logConfig: {
        enable: false,
    },
    protocol: "HTTPS",
}, { dependsOn: enableCloudRun }) // remove this if you do not need custom domain

const urlMap = new gcp.compute.URLMap("LbUrlMap", {
    defaultService: backendService.id,
}, { dependsOn: enableCloudRun }) // remove this if you do not need custom domain

const httpsProxy = new gcp.compute.TargetHttpsProxy("lb-target-proxy", {
    urlMap: urlMap.id,
    sslCertificates: [certificate.id]
}, { dependsOn: enableCloudRun }) // remove this if you do not need custom domain

new gcp.compute.GlobalForwardingRule("LbForwardingRule", {
    name: "lb-forwarding-rule",
    target: httpsProxy.id,
    ipAddress: ipAddress.id,
    ipProtocol: "TCP",
    loadBalancingScheme: "EXTERNAL_MANAGED",
    portRange: "443",
}, { dependsOn: enableCloudRun }) // remove this if you do not need custom domain

new gcp.cloudrunv2.ServiceIamMember("js-everyone", {
    name: jsService.name,
    location,
    role: "roles/run.invoker",
    member: "allUsers",
}, { dependsOn: enableCloudRun });

export const apiUrl = jsService.uri;
export const ip = ipAddress.address // remove this if you do not need custom domain
