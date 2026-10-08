import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { companySchema, eventSchema, personSchema, productSchema } from './lib/schema';

const companies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/companies' }),
  schema: companySchema,
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: productSchema,
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/people' }),
  schema: personSchema,
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/events' }),
  schema: eventSchema,
});

export const collections = { companies, products, people, events };
