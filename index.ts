import * as gcp from "@pulumi/gcp";
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";

const enableResourceManager = new gcp.projects.Service(
    "EnableResourceManager",
    {
        service: "cloudresourcemanager.googleapis.com",
    },
);

const enableCompute = new gcp.projects.Service("EnableCompute", {
    service: "compute.googleapis.com",
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

const myImage = new docker.Image(imageName, {
    imageName: pulumi
        .interpolate`${repo.location}-docker.pkg.dev/${gcp.config.project}/${repo.repositoryId}/${imageName}:${Date.now()}`,
    build: {
        context: "./app",
        platform: "linux/amd64",
    },
}, { dependsOn: enableCompute });

const jsService = new gcp.cloudrunv2.Service("js", {
    location,
    template: {
        containers: [
            {
                image: myImage.imageName,
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
    ingress: "INGRESS_TRAFFIC_ALL",
}, { dependsOn: enableCloudRun });

new gcp.cloudrunv2.ServiceIamMember("js-everyone", {
    name: jsService.name,
    location,
    role: "roles/run.invoker",
    member: "allUsers",
}, { dependsOn: enableCloudRun });

export const apiUrl = jsService.uri;
