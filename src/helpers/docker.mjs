export const parseVolume = (value) => {
  value = value.split(':');
  const [host, container] = value.length > 2
    ? [value.slice(0, -1).join(':'), value[value.length - 1]]
    : value;
  return { host, container };
}