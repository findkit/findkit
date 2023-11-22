import React, { ReactNode } from "react";
import { ErrorContainer } from "./components";
import { useFindkitContext } from "./core-hooks";
import { Slots } from "./slots";

export interface SlotProps<Name extends keyof Slots> {
	name: Name;
	props: Omit<Parameters<Slots[Name]>[0], "children" | "parts">;
	children: ReactNode;
}

function SlotRender<Name extends keyof Slots>(props: SlotProps<Name>) {
	const context = useFindkitContext();

	const SlotComponent = context.slots[props.name] as any;

	if (!SlotComponent) {
		return <>{props.children}</>;
	}

	return <SlotComponent {...props.props}>{props.children}</SlotComponent>;
}

export class SlotCatchBoundary<
	Name extends keyof Slots,
> extends React.Component<
	SlotProps<Name> & { errorFallback?: ReactNode; errorChildren?: ReactNode },
	{ error: string | null }
> {
	constructor(props: any) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { error: String(error.message ?? error) };
	}

	componentDidCatch(error: any) {
		queueMicrotask(() => {
			console.error(
				`[findkit] Error rendering slot override "${this.props.name}"`,
				this.props.props,
			);
			// Throw the error again out of this stack frame to avoid crashing
			// the app but to generate a global unhandled error which can be
			// capture by error tracking tools like Sentry
			throw error;
		});
	}

	render() {
		if (this.state.error !== null) {
			return (
				this.props.errorFallback ?? (
					<ErrorContainer
						title={`Error rendering slot "${this.props.name}"`}
						props={this.props.props}
						error={this.state.error}
					>
						{this.props.errorChildren}
					</ErrorContainer>
				)
			);
		}

		return (
			<SlotRender name={this.props.name} props={this.props.props}>
				{this.props.children}
			</SlotRender>
		);
	}
}

type NoChildren<T> = T extends { children: any } ? Omit<T, "children"> : T;
type NoChildrenProps<T extends (props: any) => any> = NoChildren<
	Parameters<T>[0]
>;
type Parts<T> = T extends { parts: infer P } ? P : {};

export function createSlotComponent<Name extends keyof Slots>(
	name: Name,
	options: {
		render: (props: NoChildrenProps<Slots[Name]>) => any;
		errorChildren?: (props: NoChildrenProps<Slots[Name]>) => any;
		parts: Parts<Parameters<Slots[Name]>[0]>;
	},
) {
	const Default = options.render as any;
	const ErrorChildren = options.errorChildren as any;
	Default.displayName = `DefaultFill[${name}]`;

	const SlotContainer = (props: SlotProps<Name>["props"]) => {
		return (
			<SlotCatchBoundary
				name={name}
				props={{ ...props, parts: options.parts }}
				errorChildren={ErrorChildren ? <ErrorChildren {...props} /> : <></>}
			>
				<Default {...props} parts={options.parts} />
			</SlotCatchBoundary>
		);
	};

	SlotContainer.displayName = `Slot[${name}]`;

	return SlotContainer;
}
