# yandex-domain-configs

Tool for generating static domain configs.

## Benefits

1. Simple config inheritance.
2. Simple domain config inheritance.
3. Config validation against JSON-schema.
4. Customizing domain list for different environments.

## Installation
npm:
```
npm install --save-dev yandex-domain-configs
```
yarn:
```
yarn add -D yandex-domain-configs
```

## Usage
npm:
```
node_modules/.bin/yandex-domain-configs [options]
```
yarn:
```
yarn yandex-domain-configs -- [options]
```


## Options

```
    -i, --input <filename>      Input file
    -o, --output-dir <dirname>  Output directory
    -s, --schema <filename>     JSON Schema
    -h, --help                  output usage information
```

## Example

`config.base.yaml`:
```yaml
# default settings
foo: 0
# objects are merged recursively when overriden
bar:
  baz: 1
# domain settings override the default ones
domains:
  yandex.ru
    foo: 2
  yandex.com
    # yandex.com will inherit settings from yandex.ru
    base: yandex.ru
    bar:
      baz: 3
```

`config.production.yaml`:
```yaml
base: config.base.yaml
# these settings override the default ones in the base config
bar:
  baz: 5
# domains not listed here will be ignored
domainList:
  - yandex.ru
  - yandex.com
# these settings override domain settings in the base config
domains:
  yandex.ru
    foo: 6
```

`config.schema.yaml`:
```yaml
title: Project configuration
type: object
required:
  - foo
properties:
  foo:
    title: Foo description
    type: object
    required:
      - bar
    properties:
      bar:
        title: Bar description
        type: string
```

## Command
```
yarn yandex-domain-configs -- -i config.production.xml -o production -s config.schema.yaml
```

## Result
`production/yandex.ru.json`:
```json
{
    "foo": 6,
    "bar": {
        "baz": 5
    }
}
```

`production/yandex.com.json`:
```json
{
    "foo": 6,
    "bar": {
        "baz": 3
    }
}
```
