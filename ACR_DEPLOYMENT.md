# Azure Container Registry (ACR) Deployment Guide

This guide explains how to set up the required GitHub secrets for deploying to Azure Container Registry (ACR) and Azure Container Apps.

## Prerequisites

1. Azure CLI installed and logged in
2. Owner or Contributor access to the Azure subscription
3. GitHub repository admin access

## 1. Create Azure Resources

Run the following commands using Azure CLI:

```bash
# Login to Azure
az login

# Set your subscription (if needed)
# az account set --subscription "your-subscription-id"

# Create a resource group (if not exists)
az group create --name nav_hosting --location eastasia

# Create an Azure Container Registry (ACR)
az acr create --resource-group nav_hosting \
  --name navicontainerregistry \
  --sku Basic \
  --admin-enabled true

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name navicontainerregistry --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name navicontainerregistry --query "passwords[0].value" -o tsv)

echo "ACR Username: $ACR_USERNAME"
echo "ACR Password: $ACR_PASSWORD"

# Create Azure AD Service Principal for GitHub Actions
az ad sp create-for-rbac \
  --name "navi-github-actions" \
  --role contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv) \
  --sdk-auth
```

## 2. Configure GitHub Secrets

Go to your GitHub repository Settings > Secrets and variables > Actions > New repository secret

Add the following secrets:

1. `AZURE_CREDENTIALS`
   - Value: The JSON output from the `az ad sp create-for-rbac` command

2. `REGISTRY_USERNAME`
   - Value: The ACR username from `$ACR_USERNAME`

3. `REGISTRY_PASSWORD`
   - Value: The ACR password from `$ACR_PASSWORD`

## 3. Update Workflow Variables

In `.github/workflows/deploy-acr.yml`, update the following environment variables if needed:

```yaml
env:
  AZURE_CONTAINER_REGISTRY: 'navicontainerregistry'  # Your ACR name
  CONTAINER_NAME: 'navi-backend'                    # Your container name
  RESOURCE_GROUP: 'nav_hosting'                     # Your resource group
  LOCATION: 'eastasia'                              # Your Azure region
  APP_NAME: 'navi-backend'                          # Your app name
```

## 4. Deploy

Push to the `dev` branch or manually trigger the workflow from the GitHub Actions tab.

## Troubleshooting

1. **Permission Issues**: Ensure the service principal has the correct RBAC roles
2. **ACR Authentication**: Verify ACR admin account is enabled
3. **Resource Quotas**: Check if you've reached Azure subscription limits
4. **Network Issues**: Ensure GitHub Actions can reach Azure services
