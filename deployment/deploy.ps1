# write information
function WriteInformation{
    param(
        [parameter(mandatory = $true)]
        [string]$message
    )
    Write-Host $message -foregroundcolor white
}

# write error
function WriteError{
    param(
        [parameter(mandatory = $true)]
        [string]$message
    )
    Write-Host $message -foregroundcolor red -BackgroundColor black
}

# write warning
function WriteWarning{
    param(
        [parameter(mandatory = $true)]
        [string]$message
    )
    Write-Host $message -foregroundcolor yellow -BackgroundColor black
}

# write success
function WriteS{
    param(
        [parameter(mandatory = $true)]
        [string]$message
    )
    Write-Host $message -foregroundcolor green -BackgroundColor black
}

function IsValidSecureUrl {
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)] [string] $url
    )
    # Url with https prefix REGEX matching
    return ($url -match "https:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)")
}
function IsValidGuid
{
    [OutputType([bool])]
    param
    (
        [Parameter(Mandatory = $true)]
        [string]$ObjectGuid
    )

    # Define verification regex
    [regex]$guidRegex = '(?im)^[{(]?[0-9A-F]{8}[-]?(?:[0-9A-F]{4}[-]?){3}[0-9A-F]{12}[)}]?$'

    # Check guid against regex
    return $ObjectGuid -match $guidRegex
}

function IsValidParam {
    [OutputType([bool])]
    param
    (
        [Parameter(Mandatory = $true)]
        $param
    )

    return -not([string]::IsNullOrEmpty($param.Value)) -and ($param.Value -ne '<<value>>')
}

# Validate input parameters.
function ValidateParameters {
    $isValid = $true
    if (-not(IsValidParam($parameters.subscriptionId))) {
        WriteError -message "Invalid subscriptionId."
        $isValid = $false;
    }

    if (-not(IsValidParam($parameters.subscriptionTenantId)) -or -not(IsValidGuid -ObjectGuid $parameters.subscriptionTenantId.Value)) {
        WriteError -message "Invalid subscriptionTenantId. This should be a GUID."
        $isValid = $false;
    }

    if (-not (IsValidParam($parameters.resourceGroupName))) {
        WriteError -message "Invalid resourceGroupName."
        $isValid = $false;
    }

    if (-not (IsValidParam($parameters.region))) {
        WriteError -message "Invalid region."
        $isValid = $false;
    }

    if (-not (IsValidParam($parameters.baseResourceName))) {
        WriteError -message "Invalid baseResourceName."
        $isValid = $false;
    }

    if (-not(IsValidParam($parameters.tenantId)) -or -not(IsValidGuid -ObjectGuid $parameters.tenantId.Value)) {
        WriteError -message "Invalid tenantId. This should be a GUID."
        $isValid = $false;
    }

    if (-not (IsValidParam($parameters.customDomainOption))) {
        WriteError -message "Invalid customDomainOption."
        $isValid = $false;
    }

    if (-not(IsValidParam($parameters.companyName))) {
        WriteError -message "Invalid companyName."
        $isValid = $false;
    }

    if (-not(IsValidSecureUrl($parameters.WebsiteUrl.Value))) {
        WriteError -message "Invalid websiteUrl. This should be an https url."
        $isValid = $false;
    }

    if (-not(IsValidSecureUrl($parameters.PrivacyUrl.Value))) {
        WriteError -message "Invalid PrivacyUrl. This should be an https url."
        $isValid = $false;
    }

    if (-not(IsValidSecureUrl($parameters.TermsOfUseUrl.Value))) {
        WriteError -message "Invalid TermsOfUseUrl. This should be an https url."
        $isValid = $false;
    }

    return $isValid
}

function ValidateResourcesNames {
    WriteInformation -message "Checking for resources availability..."

    $authorizationtoken = get-accesstokenfromcurrentuser -erroraction stop
    $resources = @(@{
            name               = $parameters.baseresourcename.value
            servicetype        = 'webapp'
            authorizationtoken = $authorizationtoken
        },
        @{
            name               = $parameters.baseresourcename.value + '-function'
            servicetype        = 'webapp'
            authorizationtoken = $authorizationtoken
        },
        @{
            name        = $parameters.baseresourcename.value
            servicetype = 'applicationinsights'
        })

    $allresourcesavailable = $true
    foreach ($resource in $resources) {
        $isresourcenameavailable = ValidateResourceNames $resource -erroraction stop
        $allresourcesavailable = $allresourcesavailable -and $isresourcenameavailable
    }

    if (!$allresourcesavailable) {
        $confirmationtitle = "Some of the resource types names already exist. If you proceed, this will update the existing resources."
        $confirmationquestion = "Do you want to proceed?"
        $confirmationchoices = "&yes", "&no" # 0 = yes, 1 = no
        
        $updatedecision = $host.ui.promptforchoice($confirmationtitle, $confirmationquestion, $confirmationchoices, 1)
        return ($updatedecision -eq 0)
    } else {
        return $true
    }
}

function ValidateResourceNames {
    param(
        [parameter(mandatory = $true)] $resourceinfo
    )

    if ($resourceinfo.servicetype -eq "applicationinsights") {
        if ($null -eq (get-azapplicationinsights | where-object name -eq $resourceinfo.name)) {
            WriteS -message "Application Insights resource ($($resourceinfo.name)) is available."
            return $true
        } else {
            WriteWarning -message "Application Insights resource ($($resourceinfo.name)) is not available."
            return $false
        }
    } else {
        $availabilityresult = $null
        $availabilityresult = IsResourceNameAvailable @resourceinfo -erroraction stop
    
        if ($availabilityresult.available) {
            WriteS -message "resource: $($resourceinfo.name) of type $($resourceinfo.servicetype) is available."
            return $true
        } else {
            WriteWarning -message "resource $($resourceinfo.name) is not available."
            WriteWarning -message $availabilityresult.message
            return $false
        }
    }
}

# Check if the name of resource is available.
function IsResourceNameAvailable {
    param(
        [parameter(mandatory = $true)] [string] $authorizationtoken,
        [parameter(mandatory = $true)] [string] $name,
        [parameter(mandatory = $true)] [validateset(
            'apimanagement', 'keyvault', 'managementgroup', 'sql', 'storageaccount', 'webapp', 'cognitiveservice')]
        $servicetype
    )

    $uribyservicetype = @{
        apimanagement    = 'https://management.azure.com/subscriptions/{subscriptionid}/providers/microsoft.apimanagement/checknameavailability?api-version=2019-01-01'
        keyvault         = 'https://management.azure.com/subscriptions/{subscriptionid}/providers/microsoft.keyvault/checknameavailability?api-version=2019-09-01'
        managementgroup  = 'https://management.azure.com/providers/microsoft.management/checknameavailability?api-version=2018-03-01-preview'
        sql              = 'https://management.azure.com/subscriptions/{subscriptionid}/providers/microsoft.sql/checknameavailability?api-version=2018-06-01-preview'
        storageaccount   = 'https://management.azure.com/subscriptions/{subscriptionid}/providers/microsoft.storage/checknameavailability?api-version=2019-06-01'
        webapp           = 'https://management.azure.com/subscriptions/{subscriptionid}/providers/microsoft.web/checknameavailability?api-version=2020-06-01'
        cognitiveservice = 'https://management.azure.com/subscriptions/{subscriptionid}/providers/microsoft.cognitiveservices/checkdomainavailability?api-version=2017-04-18'
    }

    $typebyservicetype = @{
        apimanagement    = 'microsoft.apimanagement/service'
        keyvault         = 'microsoft.keyvault/vaults'
        managementgroup  = '/providers/microsoft.management/managementgroups'
        sql              = 'microsoft.sql/servers'
        storageaccount   = 'microsoft.storage/storageaccounts'
        webapp           = 'microsoft.web/sites'
        cognitiveservice = 'microsoft.cognitiveservices/accounts'
    }

    $uri = $uribyservicetype[$servicetype] -replace ([regex]::escape('{subscriptionid}')), $parameters.subscriptionid.value
    $nameproperty = if ($servicetype -eq 'cognitiveservice') { "subdomainname" } else { "name" }
    $body = '"{0}": "{1}", "type": "{2}"' -f $nameproperty, $name, $typebyservicetype[$servicetype]

    $response = (invoke-webrequest -uri $uri -method post -body "{$body}" -contenttype "application/json" -headers @{authorization = $authorizationtoken } -usebasicparsing).content
    $response | convertfrom-json |
    select-object @{n = 'name'; e = { $name } }, @{n = 'type'; e = { $servicetype } }, @{n = 'available'; e = { $_ | select-object -expandproperty *available } }, reason, message
}

# Get access token from the logged-in user.
function get-accesstokenfromcurrentuser {
    try {
        $azcontext = get-azcontext
        $azprofile = [microsoft.azure.commands.common.authentication.abstractions.azurermprofileprovider]::instance.profile
        $profileclient = new-object -typename microsoft.azure.commands.resourcemanager.common.rmprofileclient -argumentlist $azprofile
        $token = $profileclient.acquireaccesstoken($azcontext.subscription.tenantid)
        ('bearer ' + $token.accesstoken)
    }        
    catch {
        throw
    }
} 

# To get the Azure AD app detail. 
function GetAzureADApp {
    param ($appName)
    $app = az ad app list --filter "displayName eq '$appName'" | ConvertFrom-Json
    return $app
}


# Create/re-set Azure AD app.
function CreateAzureADApp {
    param(
        [Parameter(Mandatory = $true)] [string] $AppName,
        [Parameter(Mandatory = $false)] [bool] $MultiTenant = $true,
        [Parameter(Mandatory = $false)] [bool] $AllowImplicitFlow,
        [Parameter(Mandatory = $false)] [bool] $ResetAppSecret = $true
    )
        
    try {
        WriteInformation -message "`r`nCreating Azure AD App: $appName..."

        # Check if the app already exists - script has been previously executed
        $app = GetAzureADApp $appName

        if (-not ([string]::IsNullOrEmpty($app))) {

            # Update Azure AD app registration using CLI
            $confirmationTitle = "The Azure AD app '$appName' already exists. If you proceed, this will update the existing app configuration."
            $confirmationQuestion = "Do you want to proceed?"
            $confirmationChoices = "&Yes", "&No" # 0 = Yes, 1 = No
            
            $updateDecision = $Host.UI.PromptForChoice($confirmationTitle, $confirmationQuestion, $confirmationChoices, 1)
            if ($updateDecision -eq 0) {
                WriteInformation -message "Updating the existing app..."

                az ad app update --id $app.appId --available-to-other-tenants $MultiTenant --oauth2-allow-implicit-flow $AllowImplicitFlow

                WriteInformation -message "Waiting for app update to finish..."

                Start-Sleep -s 10

                WriteS -message "Azure AD App: $appName is updated."
            } else {
                WriteError -message "Deployment canceled. Please use a different name for the Azure AD app and try again."
                return $null
            }
        } else {
            # Create Azure AD app registration using CLI
            az ad app create --display-name $appName --available-to-other-tenants $MultiTenant --oauth2-allow-implicit-flow $AllowImplicitFlow

            WriteInformation -message "Waiting for app creation to finish..."

            Start-Sleep -s 10

            WriteS -message "Azure AD App: $appName is created."
        }

        $app = GetAzureADApp $appName
        
        $appSecret = $null;
        #Reset the app credentials to get the secret. The default validity of this secret will be for 1 year from the date its created. 
        if ($ResetAppSecret) {
            $appSecret = az ad app credential reset --id $app.appId --append | ConvertFrom-Json;
        }

        WriteS -message "Azure AD App: $appName registered successfully."

        return $appSecret
    }
    catch {
        $errorMessage = $_.Exception.Message
        WriteError -message "Failed to register/configure the Azure AD app. Error message: $errorMessage"
    }
    return $null
}

function DeployARMTemplate {
    Param(
        [Parameter(Mandatory = $true)] $appId,
        [Parameter(Mandatory = $true)] $appsecret
    )
    try {
        # If resource group doesn't exist, create a new Resource Group.
        if ((az group exists --name $parameters.resourceGroupName.Value --subscription $parameters.subscriptionId.Value) -eq $false) {
            WriteInformation -message "Creating resource group $($parameters.resourceGroupName.Value)..."
            az group create --name $parameters.resourceGroupName.Value --location $parameters.region.Value --subscription $parameters.subscriptionId.Value
        }
        
        $appServicesNames = [System.Collections.ArrayList]@($parameters.BaseResourceName.Value, #app-service
        "$($parameters.BaseResourceName.Value)-function" #function
        )
        
        # Check for source control configuratiom.
        if($parameters.isUpgrade.Value -eq $true) {
            foreach ($appService in $appServicesNames) {
                WriteInformation -message "Scan $appService source control configuration."
                $deploymentConfig = az webapp deployment source show --name $appService --resource-group $parameters.resourceGroupName.Value --subscription $parameters.subscriptionId.Value
                if($deploymentConfig){
                    $deploymentConfig = $deploymentConfig | ConvertFrom-Json

                    # Source control is already configured. 
                    if($deploymentConfig.isManualIntegration -eq $true) {
                        WriteError -message "Source control already configured for $appService. Please re-run the script after removing source control configuration."
                        EXIT
                    }
                }
                else {
                    # If command failed due to resource not exists, then screen colors become red
                    [Console]::ResetColor()
                }
            }
        }

        # Deploy ARM templates
        WriteInformation -message "`nDeploying app services, Azure function, bot service, and other supporting resources... (this operation may take a while)"
        az deployment group create --resource-group $parameters.resourceGroupName.Value --subscription $parameters.subscriptionId.Value --template-file 'azuredeploy.json' --parameters "baseResourceName=$($parameters.baseResourceName.Value)" "botClientId=$appId" "botClientSecret=$appsecret" "customDomainOption=$($parameters.customDomainOption.Value)" "appDisplayName=$($parameters.appDisplayName.Value)" "appDescription=$($parameters.appDescription.Value)" "appIconUrl=$($parameters.appIconUrl.Value)" "tenantId=$($parameters.tenantId.Value)" "sku=$($parameters.hostingPlanSku.Value)" "planSize=$($parameters.hostingPlanSize.Value)" "location=$($parameters.region.Value)"

        WriteInformation -message "LASTEXITCODE $($LASTEXITCODE)"

        if ($LASTEXITCODE -ne 0) {
            [Console]::ResetColor()
            Throw "ERROR: ARM template deployment error."
        }
        
        WriteS -message "Finished deploying resources. ARM template deployment succeeded."
        
        # get the output of current deployment
        $deploymentOutput = az deployment group show --name azuredeploy --resource-group $parameters.resourceGroupName.Value --subscription $parameters.subscriptionId.Value | ConvertFrom-Json
        
        return $deploymentOutput
    }
    catch {
        WriteError -message "Error occurred while deploying Azure resources."
        throw
    }
}

# Grant Admin consent
function GrantAdminConsent {
    Param(
        [Parameter(Mandatory = $true)] $appId
        )

    $confirmationTitle = "Admin consent permissions is required for app registration using CLI"
    $confirmationQuestion = "Do you want to proceed?"
    $confirmationChoices = "&Yes", "&No" # 0 = Yes, 1 = No
    $consentErrorMessage = "Current user does not have the privilege to consent the below permissions on this app.
    * openid(Delegated)
    Please ask the tenant's global administrator to consent."

    $updateDecision = $Host.UI.PromptForChoice($confirmationTitle, $confirmationQuestion, $confirmationChoices, 1)
    if ($updateDecision -eq 0) {
        # Grant admin consent for app registration required permissions using CLI
        WriteInformation -message "Waiting for admin consent to finish..."
        az ad app permission admin-consent --id $appId
        
        if ($LASTEXITCODE -ne 0) {
            WriteError -message $consentErrorMessage
            WriteWarning -message "`nPlease inform the global admin to consent the app permissions from this link`nhttps://login.microsoftonline.com/$($parameters.tenantId.Value)/adminconsent?client_id=$appId"
        } else {
            WriteS -message "Admin consent has been granted."
        }
    } else {
        WriteWarning -message "`nPlease inform the global admin to consent the app permissions from this link`nhttps://login.microsoftonline.com/$($parameters.tenantId.Value)/adminconsent?client_id=$appId"
    }
}

# Azure AD app update. Assigning Admin-consent,RedirectUris,IdentifierUris,Optionalclaim etc. 
function ADAppUpdate {
    Param(
        [Parameter(Mandatory = $true)] $appdomainName,
        [Parameter(Mandatory = $true)] $appId
    )
    
    $configAppId = $appId
    $IdentifierUris = "api://$appdomainName"
    $appName = $parameters.baseResourceName.Value
    $RedirectUris = ("https://$appdomainName/askAwayTab/signInSimpleEnd.html")

    function CreatePreAuthorizedApplication(
        [string] $applicationIdToPreAuthorize,
        [string] $scopeId) {
        $preAuthorizedApplication = New-Object 'Microsoft.Open.MSGraph.Model.PreAuthorizedApplication'
        $preAuthorizedApplication.AppId = $applicationIdToPreAuthorize
        $preAuthorizedApplication.DelegatedPermissionIds = @($scopeId)
        return $preAuthorizedApplication
    }

    function CreateScope(
        [string] $value,
        [string] $userConsentDisplayName,
        [string] $userConsentDescription,
        [string] $adminConsentDisplayName,
        [string] $adminConsentDescription) {
        $scope = New-Object Microsoft.Open.MsGraph.Model.PermissionScope
        $scope.Id = New-Guid
        $scope.Value = $value
        $scope.UserConsentDisplayName = $userConsentDisplayName
        $scope.UserConsentDescription = $userConsentDescription
        $scope.AdminConsentDisplayName = $adminConsentDisplayName
        $scope.AdminConsentDescription = $adminConsentDescription
        $scope.IsEnabled = $true
        $scope.Type = "User"
        return $scope
    }

    # Grant Admin consent if the subscriptionTenantId and tenantId are same.
    if ($parameters.tenantId.value -eq $parameters.subscriptionTenantId.value) {
        GrantAdminConsent $configAppId
    }
    
    # Assigning graph permissions  
    az ad app update --id $configAppId --required-resource-accesses './AadAppManifest.json'

    Import-Module AzureAD

    $apps = Get-AzureADApplication -Filter "DisplayName eq '$appName'"

    if (0 -eq $apps.Length) {
        $app = New-AzureADApplication -DisplayName $appName
    } else {
        $app = $apps[0]
    }

    $applicationObjectId = $app.ObjectId

    $app = Get-AzureADMSApplication -ObjectId $applicationObjectId

    # Do nothing if the app has already been configured
    if ($app.IdentifierUris.Count -gt 0) {
        WriteS -message "`Application is already configured."
        return
    }
    WriteInformation -message "`nUpdating the app..."

    #Removing default scope user_impersonation
    $DEFAULT_SCOPE=$(az ad app show --id $configAppId | jq '.oauth2Permissions[0].isEnabled = false' | jq -r '.oauth2Permissions')
    $DEFAULT_SCOPE>>scope.json
    az ad app update --id $configAppId --set oauth2Permissions=@scope.json
    Remove-Item .\scope.json
    az ad app update --id $configAppId --remove oauth2Permissions
    
    #Re-assign app detail after removing default scope user_impersonation
    $apps = Get-AzureADApplication -Filter "DisplayName eq '$appName'"

    if (0 -eq $apps.Length) {
        $app = New-AzureADApplication -DisplayName $appName
    } else {
        $app = $apps[0]
    }

    $applicationObjectId = $app.ObjectId

    $app = Get-AzureADMSApplication -ObjectId $applicationObjectId

    # Expose an API
    $appId = $app.AppId
    $appIDUri = "$IdentifierUris/$appId"

    az ad app update --id $configAppId --identifier-uris $appIDUri
    WriteInformation -message "App URI set"

    $configApp = az ad app update --id $configAppId --reply-urls $RedirectUris
    WriteInformation -message "App reply-urls set"
                    
    # Create access_as_user scope
    # Add all existing scopes first
    $scopes = New-Object System.Collections.Generic.List[Microsoft.Open.MsGraph.Model.PermissionScope]
    $app.Api.Oauth2PermissionScopes | foreach-object { $scopes.Add($_) }
    $scope = CreateScope -value "access_as_user"  `
        -userConsentDisplayName "Access the API as the current logged-in user."  `
        -userConsentDescription "Access the API as the current logged-in user."  `
        -adminConsentDisplayName "Access the API as the current logged-in user."  `
        -adminConsentDescription "Access the API as the current logged-in user."
    $scopes.Add($scope)
    $app.Api.Oauth2PermissionScopes = $scopes
    Set-AzureADMSApplication -ObjectId $app.Id -Api $app.Api
    WriteInformation -message "Scope access_as_user added."
             
    # Authorize Teams mobile/desktop client and Teams web client to access API
    $preAuthorizedApplications = New-Object 'System.Collections.Generic.List[Microsoft.Open.MSGraph.Model.PreAuthorizedApplication]'
    $teamsRichClientPreauthorization = CreatePreAuthorizedApplication `
        -applicationIdToPreAuthorize '1fec8e78-bce4-4aaf-ab1b-5451cc387264' `
        -scopeId $scope.Id
    $teamsWebClientPreauthorization = CreatePreAuthorizedApplication `
        -applicationIdToPreAuthorize '5e3ce6c0-2b1f-4285-8d4b-75ee78787346' `
        -scopeId $scope.Id
    $preAuthorizedApplications.Add($teamsRichClientPreauthorization)
    $preAuthorizedApplications.Add($teamsWebClientPreauthorization)   
    $app = Get-AzureADMSApplication -ObjectId $applicationObjectId
    $app.Api.PreAuthorizedApplications = $preAuthorizedApplications
    Set-AzureADMSApplication -ObjectId $app.Id -Api $app.Api
    WriteInformation -message "Teams mobile/desktop and web clients applications pre-authorized."
}

#update manifest file and create a .zip file.
function GenerateAppManifestPackage {
    Param(
        [Parameter(Mandatory = $true)] $appdomainName,
        [Parameter(Mandatory = $true)] $appId
    )

    WriteInformation -message "`nGenerating package for $manifestType..."

     # Load Parameters from JSON meta-data file
    $parametersListContent = Get-Content '.\parameters.json' -ErrorAction Stop

    # Validate all the parameters.
    WriteInformation -message "Validating all the parameters from parameters.json."
    $parameters = $parametersListContent | ConvertFrom-Json

    $azureDomainBase = $appdomainName
    $manifestFilePath = '..\manifest\manifest.json'
    $destinationZipPath = "..\manifest\AskAway.zip"

    # Replace merge fields with proper values in manifest file and save
    $mergeFields = @{
        '{{Company}}'       = $parameters.companyName.Value 
        '{{MicrosoftAppId}}'= $appId
        '{{HostName}}'      = $azureDomainBase
        '{{WebsiteUrl}}'    = $parameters.websiteUrl.Value
        '{{PrivacyUrl}}'    = $parameters.privacyUrl.Value
        '{{TermsOfUseUrl}}' = $parameters.termsOfUseUrl.Value
    }
    $appManifestContent = Get-Content $manifestFilePath
    foreach ($mergeField in $mergeFields.GetEnumerator()) {
        $appManifestContent = $appManifestContent.replace($mergeField.Name, $mergeField.Value)
    }
    $appManifestContent | Set-Content $manifestFilePath -Force

    # Generate zip archive 
    $compressManifest = @{
        LiteralPath      = "..\manifest\icon-color.png", "..\manifest\icon-outline.png", $manifestFilePath
        CompressionLevel = "Fastest"
        DestinationPath  = $destinationZipPath
    }
    Compress-Archive @compressManifest -Force

    WriteS -message "Package has been created under this path $(Resolve-Path $destinationZipPath)"
}

function logout {
    az logout
    Disconnect-AzAccount
}

# Create Azure AD App principal if app is used in other tenants
function CreateAdAppPrincipal {
    Param(
        [Parameter(Mandatory = $true)] $tenantId,
        [Parameter(Mandatory = $true)] $appId
    )

    WriteInformation -message "`nPlease login to the tenant where this app template will be used in Microsoft Teams."
    az login --tenant $tenantId --allow-no-subscriptions
    
    $sp = az ad sp list --filter "appId eq '$appId'"
    if (0 -eq ($sp | ConvertFrom-Json).length) {
        WriteInformation -message "Azure AD app principal will be created in tenant: $tenantId"
        
        # create new service principal
        $sp = az ad sp create --id $appId
    }
    
    az logout
    WriteWarning -message "`nPlease inform your admin to consent the app permissions from this link`nhttps://login.microsoftonline.com/$tenantId/adminconsent?client_id=$appId"
}    

# ---------------------------------------------------------
# DEPLOYMENT SCRIPT
# ---------------------------------------------------------

#Check if Azure CLI is installed.
WriteInformation -message "Checking if Azure CLI is installed."
$localPath = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
if ($null -eq $localPath) {
    $localPath = "C:\Program Files (x86)"
}

$localPath = $localPath + "\Microsoft SDKs\Azure\CLI2"
If (-not(Test-Path -Path $localPath)) {
    WriteWarning -message "Azure CLI is not installed!"
    $confirmationtitle      = "Please select YES to install Azure CLI."
    $confirmationquestion   = "Do you want to proceed?"
    $confirmationchoices    = "&yes", "&no" # 0 = yes, 1 = no
        
    $updatedecision = $host.ui.promptforchoice($confirmationtitle, $confirmationquestion, $confirmationchoices, 1)
    if ($updatedecision -eq 0) {
        WriteInformation -message "Installing Azure CLI ..."
        Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi; Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'; Remove-Item .\AzureCLI.msi
        
        WriteS -message "Azure CLI is installed! Please close this PowerShell window and re-run this script in a new PowerShell session."
        EXIT
    } else {
        WriteError -message "Azure CLI is not installed.`nPlease install the CLI from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest and re-run this script in a new PowerShell session"
        EXIT
    }
} else {
    WriteS -message "Azure CLI is installed."
}

# # Installing required modules
WriteInformation -message "Checking if the required modules are installed..."
$isAvailable = $true
if ((Get-Module -ListAvailable -Name "Az.*")) {
    WriteInformation -message "Az module is available."
} else {
    WriteWarning -message "Az module is missing."
    $isAvailable = $false
}

if ((Get-Module -ListAvailable -Name "AzureAD")) {
    WriteInformation -message "AzureAD module is available."
} else {
    WriteWarning -message "AzureAD module is missing."
    $isAvailable = $false
}

if ((Get-Module -ListAvailable -Name "WriteAscii")) {
    WriteInformation -message "WriteAscii module is available."
} else {
    WriteWarning -message "WriteAscii module is missing."
    $isAvailable = $false
}

if (-not $isAvailable)
{
    $confirmationTitle = WriteInformation -message "The script requires the following modules to deploy: `n 1.Az module`n 2.AzureAD module `n 3.WriteAscii module`nIf you proceed, the script will install the missing modules."
    $confirmationQuestion = "Do you want to proceed?"
    $confirmationChoices = "&Yes", "&No" # 0 = Yes, 1 = No
            
    $updateDecision = $Host.UI.PromptForChoice($confirmationTitle, $confirmationQuestion, $confirmationChoices, 1)
        if ($updateDecision -eq 0) {
            if (-not (Get-Module -ListAvailable -Name "Az.*")) {
                WriteInformation -message "Installing AZ module..."
                Install-Module Az -AllowClobber -Scope CurrentUser
            }

            if (-not (Get-Module -ListAvailable -Name "AzureAD")) {
                WriteInformation -message"Installing AzureAD module..."
                Install-Module AzureAD -Scope CurrentUser -Force
            }
            
            if (-not (Get-Module -ListAvailable -Name "WriteAscii")) {
                WriteInformation -message "Installing WriteAscii module..."
                Install-Module WriteAscii -Scope CurrentUser -Force
            }
        } else {
            WriteError -message "You may install the modules manually by following the below link. Please re-run the script after the modules are installed. `nhttps://docs.microsoft.com/en-us/powershell/module/powershellget/install-module?view=powershell-7"
            EXIT
        }
} else {
    WriteS -message "All the modules are available!"
}

 # Get all the parameters from parameter.json file.
$parametersList = Get-Content '.\parameters.json' -ErrorAction Stop

# Validate all the parameters.
WriteInformation -message "Validating all the parameters from parameters.json."
$parameters = $parametersList | ConvertFrom-Json
if (-not(ValidateParameters)) {
    WriteError -message "Invalid parameters found. Please update the parameters in the parameters.json with valid values and re-run the script."
    EXIT
}

# Start Deployment.
Write-Ascii -InputObject "AskAway" -ForegroundColor Cyan

# Get the location of deployment folder
$deploymentFolderLocation = Get-Location

WriteInformation -message "Starting deployment..."

# Initialize connections - Azure Az/CLI/Azure AD
WriteInformation -message "Login with your Azure subscription account. Launching Azure sign-in window..."
Connect-AzAccount -Subscription $parameters.subscriptionId.Value -ErrorAction Stop
az login --tenant $parameters.subscriptionTenantId.value
if ($LASTEXITCODE -ne 0) {
    WriteError -message "Login failed for user..."
    EXIT
}

WriteInformation -message "Azure AD sign-in..."
Connect-AzureAD -Tenant $parameters.subscriptionTenantId.Value -ErrorAction Stop

# Validate the name of resources to be created.
if (-not(ValidateResourcesNames)) {
    WriteError -message "Please choose a different baseResourceName in the parameters.json and re-run the script. Exiting..."
    logout
    EXIT
}

# Build app
WriteInformation -message "Building the AskAway app..."
$buildScript = "$deploymentFolderLocation\build.ps1"
& $buildScript

WriteInformation -message "Build completed..."

# Create App
$appCred = CreateAzureADApp $parameters.baseresourcename.Value
if ($null -eq $appCred) {
    WriteError -message "Failed to create or update User app in Azure Active Directory. Exiting..."
    logout
    Exit
}

# Function call to Deploy ARM Template
$deploymentOutput = DeployARMTemplate $appCred.appId $appCred.password
if ($null -eq $deploymentOutput) {
    WriteError -message "Encountered an error during ARM template deployment. Exiting..."
    logout
    Exit
}

# Reading the deployment output.
WriteInformation -message "Reading deployment outputs..."

# Assigning return values to variable. 
$appdomainName = $deploymentOutput.properties.Outputs.appDomain.Value

$zipDeployScript = "$deploymentFolderLocation\zipDeploy.ps1"
& $zipDeployScript $parameters.baseresourcename.Value $parameters.resourceGroupName.Value $parameters.subscriptionId.Value

# Function call to update uris for registered app.
WriteInformation -message "Updating required parameters and urls..."
ADAppUpdate $appdomainName $appCred.appId

# Log out to avoid tokens caching
logout

#App template is deployed on tenant A and used in tenant B
if ($parameters.tenantId.Value -ne $parameters.subscriptionTenantId.Value){
    CreateAdAppPrincipal $parameters.tenantId.Value $appCred.appId
}

# Function call to generate manifest.zip folder for User and Author. 
GenerateAppManifestPackage $appdomainName $appCred.appId
# # Open manifest folder

Invoke-Item ..\Manifest\

# Deployment completed.
Write-Ascii -InputObject "DEPLOYMENT COMPLETED." -ForegroundColor Green
