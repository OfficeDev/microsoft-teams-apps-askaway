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

$appName = $args[0]
$resourceGroupName = $args[1]
$subscriptionId = $args[2]

$deploymentFolderLocation = Get-Location

$functionAppName = $appName + '-function'
$appZip = "$deploymentFolderLocation\temp_msteams-app-questionly.zip"
$funcZip = "$deploymentFolderLocation\temp_msteams-app-questionly.func.zip"

# Deploy service app.
WriteInformation -message "Deploying $appName and $functionAppName. It may take a while to complete this operation..."

Start-Job -Name $appName -ArgumentList $resourceGroupName, $appName, $subscriptionId, $appZip {
    param($resourceGroupName, $appName, $subscriptionId, $appZip)
    az webapp deployment source config-zip --resource-group $resourceGroupName --name $appName --subscription $subscriptionId --src $appZip
}

Start-Job -Name $functionAppName -ArgumentList $resourceGroupName, $functionAppName, $subscriptionId, $funcZip {
    param($resourceGroupName, $functionAppName, $subscriptionId, $funcZip)
    az functionapp deployment source config-zip --resource-group $resourceGroupName --name $functionAppName --subscription $subscriptionId --src $funcZip
}

$appDeploymentOutput = Get-Job -Name $appName | Wait-Job
$funcDeploymentOutput = Get-Job -Name $functionAppName| Wait-Job

if (($null -eq $appDeploymentOutput) -or (($null -ne $appDeploymentOutput) -and ($appDeploymentOutput.State -ne 'Completed'))) {
    WriteError -message "Encountered an error during $appName deployment. Exiting... "
    EXIT
}

if (($null -eq $funcDeploymentOutput) -or (($null -ne $funcDeploymentOutput) -and ($funcDeploymentOutput.State -ne 'Completed'))) {
    WriteError -message "Encountered an error during $functionAppName deployment. Exiting... "
    EXIT
} 
    
WriteInformation -message "Zip deployment completed successfully."

Remove-Job -Name $appName
Remove-Job -Name $functionAppName

Remove-Item -Recurse $appZip
Remove-Item -Recurse $funcZip
Remove-Item -Recurse "$deploymentFolderLocation\temp_msteams-app-questionly"
Remove-Item -Recurse "$deploymentFolderLocation\temp_msteams-app-questionly.func"