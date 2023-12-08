const created = (module: string): string => `${module} created successfully.`;
const updated = (module: string): string => `${module} updated successfully.`;
const removed = (module: string): string => `${module} removed successfully.`;
const notFound = (module: string): string => `${module} not found or not active.`;

export { created, updated, removed, notFound };
