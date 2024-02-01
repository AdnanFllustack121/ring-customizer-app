function RangeSlider({ optn, option_index, selectedOptions, onSelectOption }) {

    const the_value = optn.option_values.findIndex(oov => oov.option_value_id === selectedOptions[option_index]?.option_value_id)

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
            />

            {/* {
                !!optn?.option_values &&
                optn.option_values.map(option_value => {
                    return (
                        <>
                            <label htmlFor={option_value.option_value_id}>

                            <span className='tooltiptext'>{option_value.option_value_title}</span>

                            {
                                !!option_value.option_image_path
                                ?
                                <img src={`/apps/product-options${option_value.option_image_path}`} alt="" />
                                :
                                option_value.option_value_title
                            }
                            <input
                                type="radio"
                                name={`properties[${optn.option_title}]`}
                                value={option_value.option_value_title}
                                id={option_value.option_value_id}
                                onClick={() => onSelectOption(option_index, optn, option_value)}
                                checked={selectedOptions[option_index]?.option_value_id === option_value.option_value_id}
                            />
                            </label>
                        </>
                    )
                })
            } */}
        </>
    )
}

export default RangeSlider