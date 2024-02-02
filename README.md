## 🚀 Installation

We recommend loading sol-tracker from your Tracker instance. This ensures that the script is always in sync with your installation. The script is served as `tracker.js` or as [a name of your choice](https://github.com/electerious/Tracker/blob/master/docs/Options.md#tracker).

```html
<script async src="https://sol.example.com/tracker.js" data-sol-server="https://sol.example.com" data-sol-domain-id="hd11f820-68a1-11e6-8047-79c0c2d9bce0"></script>
```

It's also possible to install sol-tracker as a module via [npm](https://npmjs.com) or [yarn](https://yarnpkg.com).

```sh
npm install sol-tracker
```

```sh
yarn add sol-tracker
```

## 🤗 Usage

| Type                            | Usage                   | Best for                      | Records (Views) | Actions (Events) |
| :------------------------------ | :---------------------- | :---------------------------- | :-------------- | :--------------- |
| [Automatically](#automatically) | Via script tag          | Simple sites                  | ✅              | ⛔️               |
| [Manually](#manually)           | Via script tag and code | Advanced sites                | ✅              | ✅               |
| [Programmatic](#programmatic)   | Via module              | Modern sites with build tools | ✅              | ✅               |

### Automatically

The easiest way to send data to your Tracker server is by including the script along with the required attributes. Tracker will now track each page visit automatically.

This approach is perfect for static sites. It tracks a visit whenever a user visits the site or navigates to a new page. Websites with client-side routing however should consider to use any of the other approaches as this one would only track the initial page.

```html
<script async src="dist/sol-tracker.min.js" data-sol-server="https://sol.example.com" data-sol-domain-id="hd11f820-68a1-11e6-8047-79c0c2d9bce0"></script>
```

It's also possible to customize Tracker using the `data-sol-opts` attribute.

```html
<script async src="dist/sol-tracker.min.js" data-sol-server="https://sol.example.com" data-sol-domain-id="hd11f820-68a1-11e6-8047-79c0c2d9bce0" data-sol-opts='{ "ignoreLocalhost": true }'></script>
```

### Manually

Include the JS-file at the end of your `body` and start tracking page visits by calling `create` manually.

This approach is perfect for sites without a build system. It gives you more control than the automatic solution, but still allows you to use sol-tracker without a package manager or JS bundler.

```html
<script src="dist/sol-tracker.min.js"></script>

<script>
	solTracker.create('https://sol.example.com').record('hd11f820-68a1-11e6-8047-79c0c2d9bce0')
</script>
```