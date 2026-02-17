# Mannheim DS Planner - Cloud Version

A study planner for the M.Sc. Data Science program at University of Mannheim.

## Features

- Plan your courses by area (Fundamentals, Data Management, etc.)
- Track progress towards 120 ECTS
- Mark courses as completed
- Support for Additional Course modules (variable ECTS)
- Export plan to Markdown, CSV, or JSON
- **All data stored locally in your browser** (LocalStorage)

## Architecture

This is a **stateless** web application:
- **Server**: Provides read-only course catalog and export functionality
- **Client**: Stores all user data in LocalStorage

No database required. No server-side state.

## Local Development

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
python web_app.py
```

Open http://localhost:5000

## Docker

```bash
# Build
docker build -t mmds-planner .

# Run
docker run -p 8080:8080 mmds-planner
```

Open http://localhost:8080

## Azure Deployment

### Prerequisites

1. Azure account with active subscription
2. Azure CLI installed (`az`)
3. GitHub repository

### Setup Steps

1. **Create Azure Resources:**

```bash
# Login to Azure
az login

# Create resource group
az group create --name mmds-rg --location westeurope

# Create Azure Container Registry
az acr create --resource-group mmds-rg --name mmdsregistry --sku Basic

# Create Container App Environment
az containerapp env create \
  --name mmds-env \
  --resource-group mmds-rg \
  --location westeurope

# Create Container App
az containerapp create \
  --name mmds-planner \
  --resource-group mmds-rg \
  --environment mmds-env \
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3
```

2. **Create Service Principal for GitHub Actions:**

```bash
az ad sp create-for-rbac \
  --name "mmds-github-actions" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/mmds-rg \
  --sdk-auth
```

3. **Configure GitHub Secrets:**

In your GitHub repo, go to Settings > Secrets > Actions and add:

| Secret | Value |
|--------|-------|
| `AZURE_CREDENTIALS` | The JSON output from step 2 |
| `AZURE_CONTAINER_REGISTRY` | `mmdsregistry.azurecr.io` |
| `AZURE_REGISTRY_USERNAME` | From `az acr credential show` |
| `AZURE_REGISTRY_PASSWORD` | From `az acr credential show` |
| `AZURE_RESOURCE_GROUP` | `mmds-rg` |
| `AZURE_CONTAINER_APP_NAME` | `mmds-planner` |

4. **Push to main branch** - GitHub Actions will automatically build and deploy!

## Backup & Restore

- Use the **Export > Backup speichern** function to download your plan
- Use **Export > Backup laden** to restore from a backup file

This is useful when:
- Switching browsers/devices
- Clearing browser data
- Sharing your plan with others

## License

MIT
