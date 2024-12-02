# New Backend Template

## Technologies used

- Google Cloud Run
- Docker
- Pulumi
- Typescript (obviously)
- Hono

## Setting the project up

1. Create project.
2. Create a service account called `pulumi-deployer` with an owner role.

## Setting things up

Note: The end goal is to allow any user to push to the repository without
needing to set up all this since GitHub Actions will be responsible for the
deployment instead of the user.

1. If you are not the administrator, feel free to ignore this step. You must
   ensure that you use an IAM user or service account that has Programmatic
   access with rights to deploy and manage your Google Cloud resources. For the
   purposes of this tutorial, we will assume that you are the admin of the
   project and hence have full API access to manage your resources. Also ensure
   that you have a bucket to store Pulumi state. To do that, run
   `gsutil mb gs://my-pulumi-state-bucket` once you have `gcloud` installed.
2. Follow the instructions to install the
   [`gcloud` CLI](https://cloud.google.com/sdk/docs/install).
3. Run `gcloud init` to authenticate `gcloud`.
4. Run `gcloud config set project <YOUR_GCP_PROJECT_ID>` to configure it to use
   your project.
5. Run `gcloud auth application-default login` to allow Pulumi to use default
   application credentials.
6. [Install Pulumi](https://www.pulumi.com/docs/iac/get-started/gcp/begin/).
   Make sure that the Pulumi binary is in your `$PATH`.
7. Run `pulumi login gs://my-pulumi-state-bucket`.
8. Run `npm install` in the repository root.
9. Run `gcloud auth configure-docker asia-southeast1-docker.pkg.dev` to
   configure your local Docker installation to use GCR endpoints.
10. Install [Docker Engine](https://docs.docker.com/engine/) in your local
    machine. Make sure that the Docker daemon is running by running
    `docker run hello-world`.
11. Run `pulumi up`. Answer yes if they ask you to create a new stack. Use `dev`
    for the stack name. Enter the passphrase for the bucket (you need to enter
    the passphrase every single time you run a command related to deployment
    unless you set the environment variable `PULUMI_CONFIG_PASSPHRASE` as the
    passphrase). Answer yes if it asks you to modify the stack. If everything
    goes well, the service should be deployed, and the url will be listed on
    your console once it is done executing.

## Making a change

1. Run `pulumi up`.

## Tearing down

1. Run `pulumi destroy`.
2. If you want to remove your stack (no longer deploying in the future), run
   `pulumi stack rm`.

## Sources

- https://www.pulumi.com/blog/google-cloud-run-serverless-containers/
- https://www.pulumi.com/docs/iac/get-started/gcp/begin/
