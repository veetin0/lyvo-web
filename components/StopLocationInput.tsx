"use client";

import LocationAutocomplete from "./LocationAutocomplete";
import { PlaceSelection } from "./lib/places";

type StopLocationInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: PlaceSelection) => void;
  placeholder: string;
  restrictCountries?: string[];
  className?: string;
};

export default function StopLocationInput({
  value,
  onChange,
  onSelect,
  placeholder,
  restrictCountries = ["fi", "se", "no"],
  className = "mt-0",
}: StopLocationInputProps) {
  return (
    <LocationAutocomplete
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      placeholder={placeholder}
      restrictCountries={restrictCountries}
      className={className}
    />
  );
}
