<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Herramientas de verificación — Browser Automation

**Usar `agent-browser` en vez de Playwright MCP** para cualquier verificación visual
del proyecto (login, dashboard, formularios, flujos de auth).

### Por qué
Playwright MCP carga ~13,700 tokens de tool definitions al inicio de sesión y devuelve
el árbol de accesibilidad completo en cada acción. agent-browser expone comandos de
shell directos sin overhead de tool definitions — mismo trabajo, mucho menos consumo
de contexto por ciclo de verificación.

### Instalación (ya hecha en esta máquina)
- Rust/cargo instalado vía rustup
- agent-browser instalado vía `cargo install agent-browser` (binario global en PATH)
- Chrome for Testing descargado vía `agent-browser install`

### Uso básico

```powershell
agent-browser open <url>
agent-browser snapshot -i          # árbol de accesibilidad, solo elementos interactivos
agent-browser click @e1            # clic por ref del snapshot
agent-browser fill @e2 "texto"     # llenar input
agent-browser screenshot page.png
agent-browser close                # cerrar sesión al terminar
```

Encadenar comandos en una sola llamada de shell (el navegador persiste vía daemon):

```powershell
agent-browser open localhost:3000/dashboard/student && agent-browser wait --load networkidle && agent-browser snapshot -i
```

### Nota Windows
Instalar vía `npm install agent-browser` está roto en Windows (issue conocido: postinstall
no descarga el binario, y Windows Defender marca el .exe como falso positivo).
Usar siempre `cargo install agent-browser` en esta máquina.
