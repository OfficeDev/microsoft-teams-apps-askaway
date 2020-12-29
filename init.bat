cd source\msteams-app-questionly.data 
call npm.cmd install 
call npm.cmd run build 

cd .\..\msteams-app-questionly.common
call npm.cmd install 
xcopy .\..\msteams-app-questionly.data\dist\* node_modules\msteams-app-questionly.data\dist\* /s /Y
xcopy .\..\msteams-app-questionly.data\package.json node_modules\msteams-app-questionly.data\  /Y
call npm.cmd run build 

cd .\..\msteams-app-questionly 
call npm.cmd install 
xcopy .\..\msteams-app-questionly.data\dist\* node_modules\msteams-app-questionly.data\dist\* /s /Y
xcopy .\..\msteams-app-questionly.data\package.json node_modules\msteams-app-questionly.data\  /Y
xcopy .\..\msteams-app-questionly.common\dist\* node_modules\msteams-app-questionly.common\dist\* /s /Y
xcopy .\..\msteams-app-questionly.common\package.json node_modules\msteams-app-questionly.common\  /Y

cd .\..\msteams-app-questionly.func
call npm.cmd install 
xcopy .\..\msteams-app-questionly.data\dist\* node_modules\msteams-app-questionly.data\dist\* /s /Y
xcopy .\..\msteams-app-questionly.data\package.json node_modules\msteams-app-questionly.data\  /Y
xcopy .\..\msteams-app-questionly.common\dist\* node_modules\msteams-app-questionly.common\dist\* /s /Y
xcopy .\..\msteams-app-questionly.common\package.json node_modules\msteams-app-questionly.common\  /Y