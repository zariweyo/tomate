import yaml from 'js-yaml';

export async function loadYaml(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load YAML file: ${path}`);
  }

  const content = await response.text();
  return yaml.load(content);
}
