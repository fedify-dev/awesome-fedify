Contributing
============

This list aims to be trustworthy, not exhaustive.


What belongs here
-----------------

Entries should help people discover one of the following:

 -  Projects built with Fedify
 -  Libraries and tools for people using Fedify
 -  Example applications
 -  Tutorials, guides, articles, and reference material
 -  Talks, videos, and presentations

Official projects under the [fedify-dev] organization are included by default
if they are relevant to Fedify.

Third-party entries should meet these basic requirements:

 -  The project or resource is actually related to Fedify.
 -  The link works and points to a real public page or repository.
 -  The project has seen activity in roughly the last 12 months, or the resource
    remains accurate and useful despite its age.
 -  The project has a clear license if it is software.

We do not use a minimum GitHub star threshold. Fediverse tooling is still a
small ecosystem, so star counts are not a reliable gate.

[fedify-dev]: https://github.com/fedify-dev


Preferred categories
--------------------

Use the existing categories unless there is a clear reason to add a new one:

 -  Applications
 -  Libraries
 -  Integrations
 -  Drivers
 -  Tooling
 -  Utilities
 -  Examples
 -  Tutorials and resources
 -  Talks

If a project does not fit cleanly, use an existing category unless there is a
clear reason to add a new one.


Language labels
---------------

Put language information in parentheses after the link title.

Examples:

 -  `[Creating your own federated microblog][...] (English, 한국어, 日本語)`
 -  `[우리의 코드를 찾아서 – 2막. 민희님과 Fedify & Hollo 알아보기][...] (한국어, 日本語字幕)`

Do not use flag emoji. Do not add `[EN]`, `[KO]`, or similar prefixes before
titles.


Writing entry descriptions
--------------------------

Keep descriptions short and factual. One line is usually enough.

Good:

 -  `A framework for creating ActivityPub bots.`

Avoid:

 -  Marketing language
 -  Claims you cannot verify
 -  Long summaries copied from project READMEs
 -  `An amazing, production-ready framework that revolutionizes ActivityPub development.`


Finding candidates
------------------

If you are looking for more projects that use Fedify, the GitHub dependents
page is a good place to start:

 -  <https://github.com/fedify-dev/fedify/network/dependents>

Please still verify that a project is real, public, and maintained before
adding it.


Pull requests
-------------

Small pull requests are easiest to review. If you are adding many entries,
consider splitting them by category.

Before you commit, run `mise run fmt` to apply the repository's formatting
rules.

When you open a pull request:

 -  Explain why each new entry belongs in the list.
 -  Mention any edge cases, such as inactive but historically important resources.
 -  Remove dead links if you find them.

If you are unsure whether something belongs here, open an issue first.
