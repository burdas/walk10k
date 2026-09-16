# Walk10K

Genera rutas circulares a pie de la distancia que quieras.

## 🚀 Estructura del proyecto

```text
/
├── public/
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   │   └── api/
│   └── types/
└── package.json
```

## 🧞 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando                   | Acción                                            |
| :------------------------ | :------------------------------------------------ |
| `pnpm install`            | Instala dependencias                              |
| `pnpm dev`                | Inicia el servidor local en `localhost:4321`      |
| `pnpm build`              | Compila el sitio para producción en `./dist/`     |
| `pnpm preview`            | Previsualiza la compilación localmente            |
| `pnpm astro ...`          | Ejecuta comandos CLI como `astro add`, `astro check` |

## 🚀 Despliegue en Vercel

1. Conecta el repositorio Git en Vercel
2. Añade la variable de entorno `ORS_API_KEY` en Settings → Environment Variables
3. Deploy automático al hacer push

## 👀 Más información

[Documentación de Astro](https://docs.astro.build)
