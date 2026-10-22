' Arranca el bot en segundo plano (sin ventana) y guarda el registro en data\bot.log
Set fso = CreateObject("Scripting.FileSystemObject")
carpeta = fso.GetParentFolderName(WScript.ScriptFullName)
If Not fso.FolderExists(carpeta & "\data") Then fso.CreateFolder(carpeta & "\data")
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = carpeta
shell.Run "cmd /c node index.js >> data\bot.log 2>&1", 0, False
