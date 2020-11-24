cd source\msteams-app-questionly.conversation.utility
call npm.cmd install 
call npm.cmd run build 

cd .\..\msteams-app-questionly.data 
call npm.cmd install 
call npm.cmd run build 

cd .\..\msteams-app-questionly 
call npm.cmd install 
xcopy .\..\msteams-app-questionly.data\dist\* node_modules\msteams-app-questionly.data\dist\* /s /Y
xcopy .\..\msteams-app-questionly.data\package.json node_modules\msteams-app-questionly.data\  /Y
xcopy .\..\msteams-app-questionly.conversation.utility\dist\* node_modules\msteams-app-questionly.conversation.utility\dist\* /s /Y
xcopy .\..\msteams-app-questionly.conversation.utility\package.json node_modules\msteams-app-questionly.conversation.utility\  /Y

cd .\..\msteams-app-questionly.func
call npm.cmd install 
xcopy .\..\msteams-app-questionly.data\dist\* node_modules\msteams-app-questionly.data\dist\* /s /Y
xcopy .\..\msteams-app-questionly.data\package.json node_modules\msteams-app-questionly.data\  /Y
xcopy .\..\msteams-app-questionly.conversation.utility\dist\* node_modules\msteams-app-questionly.conversation.utility\dist\* /s /Y
xcopy .\..\msteams-app-questionly.conversation.utility\package.json node_modules\msteams-app-questionly.conversation.utility\  /Y
call npm.cmd run build 