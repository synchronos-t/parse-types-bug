import Parse from 'parse';

type ItemAttributes = {
  title: string;
  areaIds: string[];
};

type ItemBase = Parse.Object<ItemAttributes>;

const Item = Parse.Object.extend('Item');
const query = new Parse.Query(Item) as Parse.Query<ItemBase>;

query.containedIn('title', ['one', 'two']);

// @ts-expect-error Parse currently types this incorrectly for array-valued fields.
query.containedIn('areaIds', ['A1', 'A2']);
