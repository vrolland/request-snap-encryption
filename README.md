# Request Snap Encryption

This repository contains a MetaMask Snap (`packages/snap`) and a demo website
(`packages/site`) used to interact with the snap locally.

## Prerequisites

- Node.js `>= 18.6.0`
- Yarn `3.x`
- [MetaMask Flask](https://metamask.io/flask/) (required to load local snaps)

## Install dependencies

From the repository root:

```shell
yarn install
```

## Start everything (recommended)

Run both the website and the snap watcher in parallel:

```shell
yarn start
```

This command starts:
- the Gatsby website (`packages/site`)
- the snap watcher (`packages/snap`)

Keep this terminal running while developing.

## Start each part separately (optional)

If you prefer separate terminals:

### 1) Start the website

```shell
yarn workspace site start
```

### 2) Start the snap

```shell
yarn workspace snap start
```

To serve the snap bundle without watch mode, use:

```shell
yarn workspace snap serve
```

## Connect the snap in MetaMask Flask

1. Open MetaMask Flask in your browser.
2. Open the local website URL shown in the terminal.
3. Use the website UI to connect/install the local snap. (http://localhost:8000)
4. Approve the permission requests in MetaMask Flask.

If the website cannot connect to the snap, ensure both the site and snap
processes are still running.

