function CreateArchive {
    param (
        [Parameter(Mandatory = $true)] $appName,
        [Parameter(Mandatory = $true)] $scriptFolderPath
    )
    # Job to create archive.
    Start-Job -Name $appName -ArgumentList $appName, $scriptFolderPath {
        param($appName, $scriptFolderPath)
        $compress = @{
            Path= "$scriptFolderPath\$appName\*"
            CompressionLevel = "Fastest"
            DestinationPath = "$scriptFolderPath\$appName.zip"
        }
        Compress-Archive @compress -Force
    }
}

$scriptFolderPath = Get-Location

Set-Location $scriptFolderPath\..

$initPSPath = "$scriptFolderPath\..\init.ps1"

& $initPSPath

Set-Location $scriptFolderPath\..\source\msteams-app-questionly.func

npm run-script build

Set-Location $scriptFolderPath\..\source\msteams-app-questionly

npm run-script build

Set-Location $scriptFolderPath

# ---------------------------------------------------------
# CREATE ZIP FOR DEPLOYMENT
# ---------------------------------------------------------

# Copy required folders/files to temp folder
mkdir temp_msteams-app-questionly
Copy-Item -Path ".\..\source\msteams-app-questionly\dist" -Destination ".\temp_msteams-app-questionly\dist" -Recurse
Copy-Item ".\..\source\msteams-app-questionly\package.json" -Destination ".\temp_msteams-app-questionly"
Copy-Item ".\..\source\msteams-app-questionly\package-lock.json" -Destination ".\temp_msteams-app-questionly"
Copy-Item ".\..\source\msteams-app-questionly\web.config" -Destination ".\temp_msteams-app-questionly"

Set-Location .\temp_msteams-app-questionly\

npm install --production

# Copy data and common modules
Copy-Item -Path ".\..\..\source\msteams-app-questionly.data\dist" -Destination ".\node_modules\msteams-app-questionly.data\dist" -Recurse
Copy-Item ".\..\..\source\msteams-app-questionly.data\package.json" -Destination ".\node_modules\msteams-app-questionly.data"
Copy-Item -Path ".\..\..\source\msteams-app-questionly.common\dist" -Destination ".\node_modules\msteams-app-questionly.common\dist" -Recurse
Copy-Item ".\..\..\source\msteams-app-questionly.common\package.json" -Destination ".\node_modules\msteams-app-questionly.common"

Set-Location $scriptFolderPath

# Copy required folders/files to temp-func folder
mkdir temp_msteams-app-questionly.func
mkdir temp_msteams-app-questionly.func\add-to-group
mkdir temp_msteams-app-questionly.func\background-jobs-orchestrator
mkdir temp_msteams-app-questionly.func\background-jobs-starter
mkdir temp_msteams-app-questionly.func\broadcast-message
mkdir temp_msteams-app-questionly.func\negotiate
mkdir temp_msteams-app-questionly.func\schedule-adaptive-card
mkdir temp_msteams-app-questionly.func\update-adaptive-card

Copy-Item ".\..\source\msteams-app-questionly.func\add-to-group\function.json" -Destination ".\temp_msteams-app-questionly.func\add-to-group\function.json"
Copy-Item ".\..\source\msteams-app-questionly.func\background-jobs-orchestrator\function.json" -Destination ".\temp_msteams-app-questionly.func\background-jobs-orchestrator\function.json"
Copy-Item ".\..\source\msteams-app-questionly.func\background-jobs-starter\function.json" -Destination ".\temp_msteams-app-questionly.func\background-jobs-starter\function.json"
Copy-Item ".\..\source\msteams-app-questionly.func\broadcast-message\function.json" -Destination ".\temp_msteams-app-questionly.func\broadcast-message\function.json"
Copy-Item ".\..\source\msteams-app-questionly.func\negotiate\function.json" -Destination ".\temp_msteams-app-questionly.func\negotiate\function.json"
Copy-Item ".\..\source\msteams-app-questionly.func\schedule-adaptive-card\function.json" -Destination ".\temp_msteams-app-questionly.func\schedule-adaptive-card\function.json"
Copy-Item ".\..\source\msteams-app-questionly.func\update-adaptive-card\function.json" -Destination ".\temp_msteams-app-questionly.func\update-adaptive-card\function.json"
Copy-Item -Path ".\..\source\msteams-app-questionly.func\dist" -Destination ".\temp_msteams-app-questionly.func\dist" -Recurse
Copy-Item ".\..\source\msteams-app-questionly.func\package.json" -Destination ".\temp_msteams-app-questionly.func"
Copy-Item ".\..\source\msteams-app-questionly.func\package-lock.json" -Destination ".\temp_msteams-app-questionly.func"
Copy-Item ".\..\source\msteams-app-questionly.func\host.json" -Destination ".\temp_msteams-app-questionly.func"

Set-Location .\temp_msteams-app-questionly.func\

npm install --production

# Copy data and common modules
Copy-Item -Path ".\..\..\source\msteams-app-questionly.data\dist" -Destination ".\node_modules\msteams-app-questionly.data\dist" -Recurse
Copy-Item ".\..\..\source\msteams-app-questionly.data\package.json" -Destination ".\node_modules\msteams-app-questionly.data"
Copy-Item -Path ".\..\..\source\msteams-app-questionly.common\dist" -Destination ".\node_modules\msteams-app-questionly.common\dist" -Recurse
Copy-Item ".\..\..\source\msteams-app-questionly.common\package.json" -Destination ".\node_modules\msteams-app-questionly.common"


Set-Location $scriptFolderPath

# Create archieve 
CreateArchive "temp_msteams-app-questionly" $scriptFolderPath
CreateArchive "temp_msteams-app-questionly.func" $scriptFolderPath

Get-Job -Name "temp_msteams-app-questionly" | Wait-Job
Get-Job -Name "temp_msteams-app-questionly.func" | Wait-Job

Write-Output "Build and Archieve completed successfully."

Remove-Job -Name "temp_msteams-app-questionly"
Remove-Job -Name "temp_msteams-app-questionly.func"
