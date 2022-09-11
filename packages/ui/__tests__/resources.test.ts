import { expect, test, vi } from "vitest";
import { Resources } from "../src/resources";

test("can runs the clean up function on dispose", () => {
	const res = new Resources();
	const spy = vi.fn();
	res.create(() => spy);

	expect(spy).not.toBeCalled();

	res.dispose();
	res.dispose();

	expect(spy).toBeCalledTimes(1);
});

test("does not create the resource if is disposed before create", () => {
	const res = new Resources();
	const createSpy = vi.fn();
	const cleanupSpy = vi.fn();

	res.dispose();

	res.create(() => {
		createSpy();
		return cleanupSpy;
	});

	expect(createSpy).not.toBeCalled();
	expect(cleanupSpy).not.toBeCalled();
});

test("can clean only single resource", () => {
	const res = new Resources();
	const resource1Spy = vi.fn();
	const resource2Spy = vi.fn();

	res.create(() => {
		return resource1Spy;
	});

	const clean = res.create(() => {
		return resource2Spy;
	});

	clean();

	expect(resource1Spy).toHaveBeenCalledTimes(0);
	expect(resource2Spy).toHaveBeenCalledTimes(1);

	res.dispose();

	expect(resource1Spy).toHaveBeenCalledTimes(1);
	expect(resource2Spy).toHaveBeenCalledTimes(1);
});

test("can clean multiple resources at once", () => {
	const res = new Resources();
	const resource1Spy = vi.fn();
	const resource2Spy = vi.fn();

	res.create(() => {
		return resource1Spy;
	});

	res.create(() => {
		return resource2Spy;
	});

	res.dispose();
	res.dispose(); // cleanup should execute only once

	expect(resource1Spy).toHaveBeenCalledTimes(1);
	expect(resource2Spy).toHaveBeenCalledTimes(1);
});

test("child is cleaned when parent is disposed", () => {
	const parent = new Resources();
	const child = parent.child();

	expect(parent.size).toBe(1);

	const spy = vi.fn();

	child.create(() => {
		return spy;
	});

	parent.dispose();
	parent.dispose(); // cleanup should execute only once

	expect(spy).toHaveBeenCalledTimes(1);
	expect(parent.size).toBe(0);
});

test("child is removed from the parent after it is disposed", () => {
	const parent = new Resources();
	const child = parent.child();

	expect(parent.size).toBe(1);

	const spy = vi.fn();

	child.create(() => {
		return spy;
	});

	child.dispose();

	expect(spy).toHaveBeenCalledTimes(1);
	expect(parent.size).toBe(0);
});

test("can call cleaner only once", () => {
	const res = new Resources();
	const spy = vi.fn();

	const clean = res.create(() => {
		return spy;
	});

	clean();
	clean();

	expect(spy).toHaveBeenCalledTimes(1);
});
