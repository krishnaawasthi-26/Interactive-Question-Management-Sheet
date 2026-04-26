import { buildCategoryValue } from "../services/difficultyCategories";

function DifficultyCategorySelector({ value, defaultCategories, extraCategories, customCategories, onChange }) {
  return (
    <select className="field-base rounded-md px-2 py-1 text-xs" value={value} onChange={(event) => onChange(event.target.value)}>
      {defaultCategories.map((entry) => <option key={entry.key} value={buildCategoryValue(entry)}>{entry.label}</option>)}
      <optgroup label="See more">
        {extraCategories.map((entry) => <option key={entry.key} value={buildCategoryValue(entry)}>{entry.label}</option>)}
      </optgroup>
      {customCategories.length > 0 ? (
        <optgroup label="Custom saved">
          {customCategories.map((entry) => <option key={entry.id} value={buildCategoryValue(entry)}>{entry.label}</option>)}
        </optgroup>
      ) : null}
      <option value="custom:new">+ Custom</option>
    </select>
  );
}

export default DifficultyCategorySelector;
