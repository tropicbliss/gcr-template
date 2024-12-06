# Google Cloud Run Template

## Technologies used

- Google Cloud Run
- Docker
- Pulumi
- Typescript
- Hono

## Setting the project up

1. Create project.
2. Run `gsutil mb gs://my-pulumi-state-bucket` to create a bucket to store Pulumi state (if you want to change the name of the bucket, you'll need to update the GitHub Actions workflow `pulumi.yml`).
3. You'll need 2 GitHub repository secrets: `GOOGLE_CREDENTIALS` and `PULUMI_CONFIG_PASSPHRASE`. The latter can be set to anything you want. 
4. For the former, run the following commands to create an IAM user with the owner role:
```bash
# Create service account
gcloud iam service-accounts create my-service-account

# Grant owner role
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:my-service-account@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/owner"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=my-service-account@PROJECT_ID.iam.gserviceaccount.com
```
Copy and paste the output from `key.json` as the value for `GOOGLE_CREDENTIALS`.

5. Modify `Pulumi.dev.yaml` with your project ID (by modifying `gcp:project`) and region (by modifying `gcp:region`) (if you have changed the region, you might also have to update the `configure-docker` command in the GitHub Actions workflow `pulumi.yml`).
6. Look through `index.ts` in the repository root. You might want to modify the minimum and maximum number of instances to spawn, among other configurations.
7. If you do not require custom domains, feel free to comment out certain code in `index.ts` in the repository root. If you do require custom domains however, remember to update `quickstart:domain` in `Pulumi.dev.yaml` with your domain.
8. Commit and see it deploy. The URL will be shown in the GitHub Actions logs once it is done deploying to Google Cloud. The runner will run every time code is pushed or merged to `main`.
9. If you are using custom domains, set the A record in your DNS to the IP shown in the GitHub Actions output.

## Tearing down

1. Run `pulumi destroy`.
2. If you want to remove your stack (deleting the project), run `pulumi stack rm dev`.

Alternatively, you can manually trigger the "Teardown" GitHub Action.

## Sources

- https://www.pulumi.com/blog/google-cloud-run-serverless-containers/
- https://www.pulumi.com/docs/iac/get-started/gcp/begin/
- https://cloud.google.com/load-balancing/docs/https/setup-global-ext-https-serverless
