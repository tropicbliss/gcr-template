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

5. Modify `Pulumi.dev.yaml` with your project ID (by modifying `gcp:project`) and region (by modifying `gcp:region`).
6. Look through `index.ts` in the repository root. You might want to modify the minimum and maximum number of instances to spawn, among other configurations.
7. Commit and see it deploy. The GitHub Actions runner will run every time code is pushed or merged to `main`.

## Tearing down

1. Run `pulumi destroy`. Alternatively, manually trigger the "Teardown" GitHub Action.
2. If you want to remove your stack (no longer deploying in the future), run
   `pulumi stack rm`.

## Sources

- https://www.pulumi.com/blog/google-cloud-run-serverless-containers/
- https://www.pulumi.com/docs/iac/get-started/gcp/begin/
