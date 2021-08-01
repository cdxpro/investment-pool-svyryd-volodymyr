# Investment Pool
A implementation of the Investment pool on Ethereum

## Deploy contract to network

This installation guide expects that have global installed `ganache-cli` and `truffle`.

### Clone repository

```bash
git clone git@github.com:cdxpro/investment-pool-svyryd-volodymyr.git
```

### Install dependencies
```bash
npm install
```

### Building and deploy contract

```bash
truffle migrate --network rinkeby
```

For local environment you should run `ganache-cli`

## Testing

### Run test

```bash
truffle test
```

### Coverage

```bash
truffle run coverage
```

## License

`cdxpro/investment-pool-svyryd-volodymyr` is released under the MIT License. See the bundled [LICENSE](./LICENSE) for details.
