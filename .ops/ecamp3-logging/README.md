# ecamp3-logging

This is a helm chart to deploy log collection (fluentbit, fluentd) with a Loki sink to a cluster where
ecamp3 is running.

## Prerequisites

You need the helmfile in addition to kubectl and helm.

## Diff the deployment

```shell
./deploy.sh diff
```
