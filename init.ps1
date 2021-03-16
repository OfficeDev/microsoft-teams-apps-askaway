$scriptFolderPath = Get-Location

$dataModulePath = "$scriptFolderPath\source\msteams-app-questionly.data"
$commonModulePath = "$scriptFolderPath\source\msteams-app-questionly.common"
$serviceModulePath = "$scriptFolderPath\source\msteams-app-questionly"
$functionModulePath = "$scriptFolderPath\source\msteams-app-questionly.func"

Set-Location $dataModulePath
npm install
npm run-script build

Set-Location $commonModulePath
npm install
Copy-Item -Path "$dataModulePath\dist" -Destination ".\node_modules\msteams-app-questionly.data\dist" -Recurse
Copy-Item "$dataModulePath\package.json" -Destination ".\node_modules\msteams-app-questionly.data"
npm run-script build

Set-Location $serviceModulePath
npm install
Copy-Item -Path "$dataModulePath\dist" -Destination ".\node_modules\msteams-app-questionly.data\dist" -Recurse
Copy-Item "$dataModulePath\package.json" -Destination ".\node_modules\msteams-app-questionly.data"
Copy-Item -Path "$commonModulePath\dist" -Destination ".\node_modules\msteams-app-questionly.common\dist" -Recurse
Copy-Item "$commonModulePath\package.json" -Destination ".\node_modules\msteams-app-questionly.common"

Set-Location $functionModulePath
npm install
Copy-Item -Path "$dataModulePath\dist" -Destination ".\node_modules\msteams-app-questionly.data\dist" -Recurse
Copy-Item "$dataModulePath\package.json" -Destination ".\node_modules\msteams-app-questionly.data"
Copy-Item -Path "$commonModulePath\dist" -Destination ".\node_modules\msteams-app-questionly.common\dist" -Recurse
Copy-Item "$commonModulePath\package.json" -Destination ".\node_modules\msteams-app-questionly.common"