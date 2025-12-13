# Eskimo Print Server installers

Esta pasta deve expor os pacotes ZIP que os administradores podem baixar para instalar o Print Server local. Além do pacote Windows (`EskimoPrintServer-win-x64.zip`), adicionamos a partir de agora os pacotes macOS:

- `EskimoPrintServer-osx-arm64.zip`
- `EskimoPrintServer-osx-x64.zip`

Cada ZIP precisa conter o binário `Eskimo.PrintServer` e um `README.txt` com os passos mínimos para execução:

```txt
chmod +x Eskimo.PrintServer
./Eskimo.PrintServer

Depois abra Admin > Impressoras e configure a loja, impressora e chave.
```

### Publicação macOS

1. macOS Apple Silicon (arm64):
   ```
   dotnet publish -c Release -r osx-arm64 /p:PublishSingleFile=true /p:SelfContained=true
   ```
2. macOS Intel (x64):
   ```
   dotnet publish -c Release -r osx-x64 /p:PublishSingleFile=true /p:SelfContained=true
   ```
3. Empacote cada pasta `bin/Release/net8.0/osx-*/publish` em um ZIP com o nome correto.

No conteúdo do ZIP, inclua o binário compilado e um `README.txt` com os comandos acima para que o lojista saiba dar permissão e rodar o servidor.
