WAX Block Realtime Node Server
==============================

> Production deployment, configuration reference and the health endpoint are documented in
> [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md), [docs/CONFIGURATION.md](../../docs/CONFIGURATION.md) and
> [docs/API.md](../../docs/API.md).

This server application provides real-time tracking of WAX blockchain data. The data can be easily configured to track specific network elements such as transactions, blocks, and more.

Installation
------------

From the monorepo root, install both apps' dependencies with:

```sh
npm ci
cp apps/api/.env.example apps/api/.env
```

Configuration
-------------

Set the endpoint environment variables in `apps/api/.env`. The configuration
defaults live in `apps/api/src/config/config.js`. Specify the following endpoints
according to your needs:

```sh

endpoints: {
        default: "",
        state: "",
        block: "",
        transaction: "",
        history: "",
        lightapi: "",
        nfts: {
            simpleassets: "",
            atomicassets: ""
        }
    }
```

Please ensure that all these URLs are correctly pointing to their respective servers.

Running the Server
------------------

To start the server, use the command:

```sh
npm run start:api
```

Use `npm run dev:api` for watch mode and `npm run test:api` to run the API test suite.
These commands run in the API workspace so relative cache paths remain under
`apps/api/cache`.

Additional Information
----------------------

-   The `index.js` file is the main entry point for the server. It sets up the server and also configures the sockets, caching and other key functionalities.
-   The `config.js` file found in the `src/config` directory is used for configuration of server settings such as network parameters, server host and port, and endpoints for different network data.

Error Handling
--------------

The server is set up to handle unexpected errors and clean up before exit. These events are logged for further investigation. See the bottom section of `index.js` for the respective code.

Network Configuration
---------------------

The server defaults to WAX mainnet. Set `NETWORK_TYPE=testnet` to select testnet
(the `testnet` CLI argument is also supported). Both networks use the same
environment variable names: `HOST`, `PORT`, `BLOCKCHAIN_DEAFULT`,
`BLOCKCHAIN_STATE`, `BLOCKCHAIN_BLOCK`, `BLOCKCHAIN_TRANSACTION`,
`BLOCKCHAIN_HISTORY`, `LIGHT_API`, `SIMPLEASSETS`, `ATOMICASSETS`, `ASSETS_COUNT`,
and `ASSETS_COUNT_TIMESTAMP`. Set their values to match the selected chain.
`HOST` is currently unused by the server listener; `PORT` defaults to 8080.

Copy `apps/api/.env.mainnet` or `apps/api/.env.testnet` to `apps/api/.env` for the
corresponding preset, then restart the API (or recreate its Compose container).
The preset filenames are not loaded automatically.

Allowed configurations are

mainnet chain id: 1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4

testnet chain id: f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12
