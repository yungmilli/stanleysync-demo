#define MyAppName "StanleySync App"
#define MyAppVersion "0.9.0-rc.1"
#define MyAppPublisher "StanleySync"
#define MyAppExeName "START_STANLEYSYNC.bat"
#define SuiteRoot "..\.."

[Setup]
AppId={{0B2AF46D-9B40-4C5F-8F3E-0F8E5F8A1D20}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\StanleySync App
DefaultGroupName=StanleySync App
DisableProgramGroupPage=yes
OutputDir={#SuiteRoot}\release
OutputBaseFilename=StanleySync-App-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Files]
Source: "{#SuiteRoot}\scripts\installer\START_STANLEYSYNC_INSTALLED.bat"; DestDir: "{app}"; DestName: "START_STANLEYSYNC.bat"; Flags: ignoreversion
Source: "{#SuiteRoot}\scripts\installer\INITIALIZE_LOCAL_DATABASE.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SuiteRoot}\*"; DestDir: "{app}\StanleySync_Suite"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*,.next\*,release\*,.tmp\*,archive\old-quick-launch\*,scripts\local\*.log"

[Icons]
Name: "{autoprograms}\StanleySync App"; Filename: "{app}\START_STANLEYSYNC.bat"; WorkingDir: "{app}"
Name: "{autoprograms}\Initialize StanleySync Database"; Filename: "{app}\INITIALIZE_LOCAL_DATABASE.bat"; WorkingDir: "{app}"
Name: "{autodesktop}\StanleySync App"; Filename: "{app}\START_STANLEYSYNC.bat"; WorkingDir: "{app}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Run]
Filename: "{app}\INITIALIZE_LOCAL_DATABASE.bat"; Description: "Initialize local database and build StanleySync"; Flags: postinstall skipifsilent unchecked
