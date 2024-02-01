function DropDown({ optn, option_index, selectedOptions, onSelectOption }) {
    return (
        <>
            <legend>{optn.option_title}:</legend>
            <select
                name={`properties[${optn.option_title}]`}
                id={optn.option_id}
                onChange={(event) => {
                    const option_value = optn.option_values.find(o_v => o_v.option_value_id === event.target.value)
                    onSelectOption(option_index, optn, option_value)
                }}
            >
                {
                    !!optn?.option_values &&
                    optn.option_values.map(option_value => {
                        return (
                            // <>
                            //     <label htmlFor={option_value.option_value_id}>

                            //     <span className='tooltiptext'>{option_value.option_value_title}</span>

                            //     {
                            //         !!option_value.option_image_path
                            //         ?
                            //         <img src={`/apps/product-options${option_value.option_image_path}`} alt="" />
                            //         :
                            //         option_value.option_value_title
                            //     }
                            //     <input
                            //         type="radio"
                            //         name={`properties[${optn.option_title}]`}
                            //         value={option_value.option_value_title}
                            //         id={option_value.option_value_id}
                            //         onClick={() => onSelectOption(option_index, optn, option_value)}
                            //         checked={selectedOptions[option_index]?.option_value_id === option_value.option_value_id}
                            //     />
                            //     </label>
                            // </>
                            <option
                                value={option_value.option_value_id}
                                selected={selectedOptions[option_index]?.option_value_id === option_value.option_value_id}
                            >
                                {option_value.option_value_title}
                            </option>
                        )
                    })
                }
            </select>
        </>
    )
}

export default DropDown