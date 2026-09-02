$ErrorActionPreference = "Stop"

Write-Host "=========================================================="
Write-Host "         INSTALADOR DE ACCESO DIRECTO M1"
Write-Host "=========================================================="

# 1. Detectar Ruta del Repo
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = (Get-Item "$scriptDir\..\..").FullName
Write-Host "[INFO] Ruta del proyecto detectada: $projectDir"

# 2. Archivo BAT objetivo
$targetBat = "$projectDir\tools\windows\start-m1-local.bat"
if (-Not (Test-Path $targetBat)) {
    Write-Host "[ERROR] No se ahcontro el archivo de arranque: $targetBat" -ForegroundColor Red
    exit 1
}

# 3. Detectar Desktop
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutFile = "$desktopPath\M1 CONTROL CENTER.lnk"

Write-Host "[INFO] Localizacion de Escritorio: $desktopPath"

# 4. Crear WScript.Shell
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutFile)

# 5. Configurar Propiedades
$Shortcut.TargetPath = $targetBat
$Shortcut.WorkingDirectory = $projectDir
$Shortcut.Description = "Ejecutar Motor M1 Precalificacion (Control Center)"

# 6. Asignar icono si existe
$iconPath = "$projectDir\assets\icons\m1-control-center.ico"
if (Test-Path $iconPath) {
    Write-Host "[INFO] Icono personalizado encontrado. Asignando..."
    $Shortcut.IconLocation = "$iconPath"
} else {
    Write-Host "[INFO] Icono personalizado no encontrado. Usando generico. (Crea assets/icons/m1-control-center.ico en un futuro)" -ForegroundColor Yellow
    # Icono generico de sistema (Engrane/Pantalla)
    $Shortcut.IconLocation = "shell32.dll, 86"
}

# 7. Guardar Accesso
$Shortcut.Save()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " EXITO: Acceso directo creado en el escritorio." -ForegroundColor Green
Write-Host " -> M1 CONTROL CENTER" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Cierra esta ventana y prueba haciendo doble clic en el icono del escritorio."
