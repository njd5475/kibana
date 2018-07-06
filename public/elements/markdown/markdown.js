import header from './header.png';

export const markdown = () => ({
  name: 'markdown',
  displayName: 'Markdown',
  help: 'Markup from Markdown',
  image: header,
  expression: `filters
| demodata
| markdown "### Welcome to the Markdown Element.

Good news! You're already connected to some demo data!

The datatable contains
**{{rows.length}} rows**, each containing
 the following columns:
{{#each columns}}
 **{{name}}**
{{/each}}

You can use standard Markdown in here, but you can also access your piped-in data using Handlebars. If you want to know more, check out the [Handlebars Documentation](http://handlebarsjs.com/expressions.html)

#### Enjoy!" | render`,
});
