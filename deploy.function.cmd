@if "%SCM_TRACE_LEVEL%" NEQ "4" @echo off

:: ----------------------
:: KUDU Deployment Script
:: Version: 1.0.9
:: ----------------------

:: Prerequisites
:: -------------

:: Verify node.js installed
where node 2>nul >nul
IF %ERRORLEVEL% NEQ 0 (
  echo Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment.
  goto error
)

:: Setup
:: -----

setlocal enabledelayedexpansion

SET ARTIFACTS=%~dp0%..\artifacts

IF NOT DEFINED DEPLOYMENT_SOURCE_FUNC (
  SET DEPLOYMENT_SOURCE_FUNC=%~dp0%\source\msteams-app-questionly.func
)

IF NOT DEFINED DEPLOYMENT_SOURCE_DATA (
  SET DEPLOYMENT_SOURCE_DATA=%~dp0%\source\msteams-app-questionly.data
)

IF NOT DEFINED DEPLOYMENT_SOURCE_COMMON (
  SET DEPLOYMENT_SOURCE_COMMON=%~dp0%\source\msteams-app-questionly.common
)

IF NOT DEFINED DEPLOYMENT_TARGET (
  SET DEPLOYMENT_TARGET=%ARTIFACTS%\wwwroot
)

IF NOT DEFINED NEXT_MANIFEST_PATH (
  SET NEXT_MANIFEST_PATH=%ARTIFACTS%\manifest

  IF NOT DEFINED PREVIOUS_MANIFEST_PATH (
    SET PREVIOUS_MANIFEST_PATH=%ARTIFACTS%\manifest
  )
)

IF NOT DEFINED KUDU_SYNC_CMD (
  :: Install kudu sync
  echo Installing Kudu Sync
  call npm install kudusync -g --silent
  IF !ERRORLEVEL! NEQ 0 goto error

  :: Locally just running "kuduSync" would also work
  SET KUDU_SYNC_CMD=%appdata%\npm\kuduSync.cmd
)
goto Deployment

:: Utility Functions
:: -----------------

:SelectNodeVersion

IF DEFINED KUDU_SELECT_NODE_VERSION_CMD (
  :: The following are done only on Windows Azure Websites environment
  call %KUDU_SELECT_NODE_VERSION_CMD% "%DEPLOYMENT_SOURCE%" "%DEPLOYMENT_TARGET%" "%DEPLOYMENT_TEMP%"
  IF !ERRORLEVEL! NEQ 0 goto error

  IF EXIST "%DEPLOYMENT_TEMP%\__nodeVersion.tmp" (
    SET /p NODE_EXE=<"%DEPLOYMENT_TEMP%\__nodeVersion.tmp"
    IF !ERRORLEVEL! NEQ 0 goto error
  )
  
  IF EXIST "%DEPLOYMENT_TEMP%\__npmVersion.tmp" (
    SET /p NPM_JS_PATH=<"%DEPLOYMENT_TEMP%\__npmVersion.tmp"
    IF !ERRORLEVEL! NEQ 0 goto error
  )

  IF NOT DEFINED NODE_EXE (
    SET NODE_EXE=node
  )

  SET NPM_CMD="!NODE_EXE!" "!NPM_JS_PATH!"
) ELSE (
  SET NPM_CMD=npm
  SET NODE_EXE=node
)

goto :EOF

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Deployment
:: ----------

:Deployment
echo Handling node.js deployment.

:: 1. Select node version for build
call :SelectNodeVersion

:: 2. Install npm packages for data project
IF EXIST "%DEPLOYMENT_SOURCE_DATA%\package.json" (
  pushd "%DEPLOYMENT_SOURCE_DATA%"
  call :ExecuteCmd !NPM_CMD! install --no-audit
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 3. Build data project
IF EXIST "%DEPLOYMENT_SOURCE_DATA%\package.json" (
  pushd "%DEPLOYMENT_SOURCE_DATA%"
  call :ExecuteCmd !NPM_CMD! run-script build
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 4 Install npm packages for common project
IF EXIST "%DEPLOYMENT_SOURCE_COMMON%\package.json" (
  pushd "%DEPLOYMENT_SOURCE_COMMON%"
  call :ExecuteCmd !NPM_CMD! install --no-audit
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 5. copy data node module
IF DEFINED DEPLOYMENT_SOURCE_COMMON (
  pushd "%DEPLOYMENT_SOURCE_COMMON%"
  xcopy .\..\msteams-app-questionly.data\dist\* node_modules\msteams-app-questionly.data\dist\* /s /Y
  xcopy .\..\msteams-app-questionly.data\package.json node_modules\msteams-app-questionly.data\  /Y
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 6. Build common project
IF EXIST "%DEPLOYMENT_SOURCE_COMMON%\package.json" (
  pushd "%DEPLOYMENT_SOURCE_COMMON%"
  call :ExecuteCmd !NPM_CMD! run-script build
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 7. Install npm packages for func project
IF EXIST "%DEPLOYMENT_SOURCE_FUNC%\package.json" (
  pushd "%DEPLOYMENT_SOURCE_FUNC%"
  call :ExecuteCmd !NPM_CMD! install --no-audit
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 8. Copy data and common node modules
IF DEFINED DEPLOYMENT_SOURCE_FUNC (
  pushd "%DEPLOYMENT_SOURCE_FUNC%"
  xcopy .\..\msteams-app-questionly.data\dist\* node_modules\msteams-app-questionly.data\dist\* /s /Y
  xcopy .\..\msteams-app-questionly.data\package.json node_modules\msteams-app-questionly.data\  /Y
  xcopy .\..\msteams-app-questionly.common\dist\* node_modules\msteams-app-questionly.common\dist\* /s /Y
  xcopy .\..\msteams-app-questionly.common\package.json node_modules\msteams-app-questionly.common\  /Y
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 9. Build func project
IF EXIST "%DEPLOYMENT_SOURCE_FUNC%\package.json" (
  pushd "%DEPLOYMENT_SOURCE_FUNC%"
  call :ExecuteCmd !NPM_CMD! run-script build
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 10. KuduSync
IF /I "%IN_PLACE_DEPLOYMENT%" NEQ "1" (
  call :ExecuteCmd "%KUDU_SYNC_CMD%" -v 50 -f "%DEPLOYMENT_SOURCE_FUNC%" -t "%DEPLOYMENT_TARGET%" -n "%NEXT_MANIFEST_PATH%" -p "%PREVIOUS_MANIFEST_PATH%" -i ".git;.hg;.deployment;deploy.cmd"
  IF !ERRORLEVEL! NEQ 0 goto error
)

:: 11. Select node version for run
call :SelectNodeVersion

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
goto end

:: Execute command routine that will echo out when error
:ExecuteCmd
setlocal
set _CMD_=%*
call %_CMD_%
if "%ERRORLEVEL%" NEQ "0" echo Failed exitCode=%ERRORLEVEL%, command=%_CMD_%
exit /b %ERRORLEVEL%

:error
endlocal
echo An error has occurred during web site deployment.
call :exitSetErrorLevel
call :exitFromFunction 2>nul

:exitSetErrorLevel
exit /b 1

:exitFromFunction
()

:end
endlocal
echo Finished successfully.