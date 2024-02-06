function RangeSlider({ optn, option_index, selectedOptions, onSelectOption }) {

    const the_value = optn.option_values.findIndex(oov => oov.option_value_id === selectedOptions[option_index]?.option_value_id)

    console.log('optn.option_values', optn.option_values)

    return (
        <>
            <legend>{optn.option_title}:</legend>

            <input
                type="range"
                name={`properties[${optn.option_title}]`}
                id={optn.option_id}
                min={0}
                max={optn.option_values.length-1}
                step={1}
                onChange={(event) => {
                    const option_value = optn.option_values[event.target.value]
                    onSelectOption(option_index, optn, option_value)
                }}
                value={the_value}
                list={`${optn.option_id}_list`}
            />

            <datalist id={`${optn.option_id}_list`}>
                {
                    optn.option_values.map((oov, oov_index) => {
                        return (
                            <option value={oov_index} label={optn.option_values[oov_index].option_value_title}></option>
                        )
                    })
                }
            </datalist>

        </>
    )
}

export default RangeSlider