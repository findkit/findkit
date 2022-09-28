# Embedding in React

Findkit UI can be also embedded inside frontend frameworks. Here's some
embedding patterns for React.js.

All the considrations in each pattern if valid when embedding inside React as
well. So take care to add loading indicators, focus trapping etc.

## Fullscreen Modal

When using the Fullscreen Modal Pattern the `FindkitUI` instance can be created
globally at the module level and only bind the open button inside the React
component which creates the button.

```tsx
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
});

function SearchButton() {
	const ref = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (ref.current) {
			// Return the unbind function as the effect clean up
			return ui.openFrom(ref.current);
		}
	});

	return (
		<button ref={ref} type="button">
			Open Search
		</button>
	);
}
```

<Codesandbox example="bundled/react-fullscreen-modal" />

## Custom Container

The `FindkitUI` can be also rendered into a React Component by using the
[`container` option](/ui/api/#container) and the React `useEffect()` and
`useRef()` hooks. This is because React creates the DOM element so we need
to dispose the `FindkitUI` instance when the component is unmounted.

```tsx
function App() {
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const ui = new FindkitUI({
			publicToken: "<TOKEN>",
			container: containerRef.current,
			header: false,
			modal: false,
		});

		if (inputRef.current) {
			ui.bindInput(inputRef.current);
		}

		return () => {
			// Ensure that all event listeners are
			// removed when the component is unmounted
			ui.dispose();
		};
	}, []);

	return (
		<div>
			<input ref={inputRef} type="text" placeholder="Search" />
			<div ref={containerRef} className="custom-container" />
		</div>
	);
}
```

If you need to access some `FinkitUI` state during React rendering you must put
them into the React with `useState()` using the [`FindkitUI` events
api](/ui/api/events).

Here's an example how to do this with the [Seach Params](/ui/api/params):

<Codesandbox example="bundled/react-custom-container" />
