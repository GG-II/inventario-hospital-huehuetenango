@echo off
echo Configurando Firewall de Windows...

netsh advfirewall firewall add rule name="Hospital Inventory - HTTP" dir=in action=allow protocol=TCP localport=3000

echo ✅ Regla de firewall agregada
echo.
echo El puerto 3000 está ahora abierto para conexiones entrantes
pause