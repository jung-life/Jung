# Code Citations

## License: unknown
https://github.com/mactung/sound-app/tree/be0d048d3568cad6f54bb150b34ab2d4fbb0dfd3/src/screens/settings/index.tsx

```
> {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  return
```


## License: unknown
https://github.com/WallysonGalvao/devriseweek-starwarswiki-challenge/tree/b79817552201d411cad8d75f4f39e3b8f671fa2d/src/components/organisms/WhereToWatchList/index.tsx

```
async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}
```

