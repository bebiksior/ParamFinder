<div align="center">
  <img width="1000" alt="image" src="https://user-images.githubusercontent.com/6225588/211916659-567751d1-0225-402b-9141-4145c18b0834.png">

  <br />
  <br />
  <a href="https://caido.io/">Website</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://dashboard.caido.io/">Dashboard</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://docs.caido.io/" target="_blank">Docs</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://links.caido.io/roadmap">Roadmap</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/caido/caido/tree/main/brand">Branding</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://links.caido.io/www-discord" target="_blank">Discord</a>
  <br />
  <hr />
</div>

# 🔰 StarterKit Plugin

This is the starter kit for the Caido plugin system.

This template is full-stack, with both a backend and frontend plugin. This is called a `plugin package`.
For frontend only use the [frontend](https://github.com/caido/frontend) starterkit.

## Note

I modified the starerkit to include React & MUI v6. I also included [caido-material-ui](https://github.com/bebiksior/caido-materialui) to provide a consistent theme across your plugin and Caido.

I recommend using [allotment](https://github.com/johnwalley/allotment) for splitting your UI into multiple panels.

## 🏎️ Usage

1. `pnpm install`
1. Make some modifications in `src`
1. `pnpm build`
1. Upload the `plugin_package.zip` in the `dist` folder to your Caido instance

## 🗒️ Release

The Github Action `release` can be used to create a release of your `plugin package`.

> If you want to sign your `plugin package`, you need an ed25519 private key named `PRIVATE_KEY` in your Github Action secrets.

To release your plugin to the store, you have to follow a set of operations. Please check out our documentation on the subject.
