import { useFetcher, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
    BlockStack,
    DropZone,
    FormLayout,
    IndexFilters,
    IndexTable,
    InlineStack,
    LegacyStack,
    Modal,
    OptionList,
    Page,
    Popover,
    Spinner,
    Text,
    TextField,
    Thumbnail,
    useIndexResourceState,
    useSetIndexFiltersMode,
} from "@shopify/polaris";
import { NoteMinor } from '@shopify/polaris-icons';
import { useCallback, useEffect, useReducer, useState } from "react";
import { authenticate } from "../shopify.server";
import {
    json,
    unstable_composeUploadHandlers,
    unstable_createFileUploadHandler,
    unstable_createMemoryUploadHandler,
    unstable_parseMultipartFormData
} from "@remix-run/node";
import { Files } from "../db.server";
import Select from "react-select";

import CreatableSelect from "react-select/creatable";

import { deleteFile } from "../utils";


export const loader = async ({ request }) => {
    await authenticate.admin(request)
  
    const url = new URL(request.url);
    const query = url.searchParams.get("query")
    const type = url.searchParams.get("type")

    const options = []
    if (!!query) {
        // options.name = {
        //     $regex: query,
        //     $options: 'i'
        // }
        // options.type = {
        //     $regex: query,
        //     $options: 'i'
        // }

        options.push({
            $match: {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { type: { $regex: query, $options: 'i' } }
                ]
            }
        })
    }

    if (!!type && type !== 'all') {
        options.push({
            $match: {
                type: type
            }
        })
    }

    let files = []
    if (options.length) {
        files = await Files.aggregate(options)
    } else {
        files = await Files.find()
    }

    return json({
        success: true,
        data: files,
        tabs: await Files.distinct('type', null, { sort: false })
    })
}


export const action = async ({ request }) => {
    await authenticate.admin(request)

    switch (request.method) {
        case "POST":
            const uploadHandler = unstable_composeUploadHandlers(
                unstable_createFileUploadHandler({
                    directory: 'public/uploads/files',
                    maxPartSize: 10000000,
                    file: ({ filename }) => filename,
                }),
                // parse everything else into memory
                unstable_createMemoryUploadHandler()
            )

            const formData = await unstable_parseMultipartFormData(
                request,
                uploadHandler
            )

            const option_value_title = formData.get("option_value_title")
            const colorImageFile = formData.get("colorImageFile")
            const type = JSON.parse(formData.get("type"))

            const isColorCreated = await Files.create({
                name: option_value_title,
                type: type,
                filePath: `/uploads/files/${colorImageFile.name}`
            })
            break;

        case "PATCH":
            const uploadHandlerToUpdate = unstable_composeUploadHandlers(
                unstable_createFileUploadHandler({
                    directory: 'public/uploads/files',
                    maxPartSize: 10000000,
                    file: ({ filename }) => filename,
                }),
                // parse everything else into memory
                unstable_createMemoryUploadHandler()
            )

            const formDataToUpdate = await unstable_parseMultipartFormData(
                request,
                uploadHandlerToUpdate
            )
            const colorId = formDataToUpdate.get("colorId")
            const colorNameToUpdate = formDataToUpdate.get("option_value_title")
            const colorImageFileToUpdate = formDataToUpdate.get("colorImageFile")
            const typeToUpdate = JSON.parse(formDataToUpdate.get("type"))

            const found_colors = await Files.findById(colorId)

            const dataToUpdate = {
                name: colorNameToUpdate,
                type: typeToUpdate
            }
            if (!!colorImageFileToUpdate) {
                await deleteFile(found_colors.filePath)
                dataToUpdate.filePath = `/uploads/files/${colorImageFileToUpdate.name}`
            }
            const isColorUpdated = await Files.findOneAndUpdate({
                _id: colorId
            }, dataToUpdate)

            break;

        case "DELETE":
            const body = await request.formData()
            const selectedResources = body.get("selectedResources")
            if (!!selectedResources) {
                const found_colors = await Files.findById(selectedResources)

                await deleteFile(found_colors.filePath)

                const isDeleted = await Files.findByIdAndDelete(selectedResources)
            }
            break;

        default:
            break;
    }

    return json({
        success: true
    })
}


const reducer = (state, action) => {
    switch (action.type) {
        case "CLEAR":
            return {
                colorId: '',
                option_value_title: '',
                colorImageFile: null,
                option_image_path: '',
                type: []
            }
        default:
            return { ...state, ...action }
    }
}


export default function ColorsPage() {

    const navigation = useNavigation()
    const submit = useSubmit()
    const loaderData = useLoaderData()
    const fetcher = useFetcher()

    const isLoading = ["loading", "submitting"].includes(navigation.state)

    const [files, setFiles] = useState(loaderData?.data.length ? loaderData.data.map(singleColor => ({
        id: singleColor._id,
        name: singleColor.name,
        type: singleColor.type,
        thumbnail: singleColor.filePath
    })) : [])


    const {selectedResources, allResourcesSelected, handleSelectionChange, clearSelection} = useIndexResourceState(files, false)

    const [modalData, dispatchModalData] = useReducer(reducer, {
        colorId: '',
        option_value_title: '',
        colorImageFile: null,
        option_image_path: '',
        type: ''
    })

    const [isModalActive, setModalActive] = useState(false)

    const [selectedTab, setSelectedTab] = useState(0)
    const [itemStrings, setItemStrings] = useState(!!loaderData?.tabs.length ? [
        { value: 'All', label: 'All' },
        ...loaderData.tabs.map(t => ({ value: t, label: t }))
    ] : [{ value: 'All', label: 'All' }])
    console.log('itemStrings', itemStrings)

    const tabs = itemStrings.map((item, index) => ({
        content: item.value,
        index,
        onAction: () => {
            // const tabName = item.toLowerCase().replace(/ /g, "_")
            const tabName = item.value

            if(!!tabName && tabName != "All") {
                fetcher.load(`?query=${queryValue}&type=${tabName}`)
            } else {
                fetcher.load(`?query=${queryValue}`)
            }
        },
        id: `${item.value}-${index}`,
        isLocked: index === 0
    }))


    const handleChangeColorName = useCallback(
        (newValue) => dispatchModalData({ option_value_title: newValue }),
        [],
    )

    const handleSelectChange = useCallback(
        (value) => {
            dispatchModalData({ type: value })
        },
        [],
    )

    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) => dispatchModalData({ colorImageFile: acceptedFiles[0] }),
        [],
    )

    const handleModalChange = useCallback((...args) => {
        setModalActive(!isModalActive)
        dispatchModalData({ type: "CLEAR" })
    }, [isModalActive])

    const handleColorSave = () => {
        const formData = new FormData()
        formData.append("option_value_title", modalData.option_value_title)
        formData.append("colorImageFile", modalData.colorImageFile)
        formData.append("type", JSON.stringify(modalData.type.map(mt => mt.value)))
        submit(formData, { replace: true, method: "POST", encType: "multipart/form-data" })
        handleModalChange()
    }

    const handleColorUpdate = () => {
        let isSomethingChanged = false
        const formData = new FormData()
        formData.append("colorId", modalData.colorId)
        formData.append("option_value_title", modalData.option_value_title)

        formData.append("type", JSON.stringify(modalData.type.map(mt => mt.value)))
        if (modalData.colorImageFile) {
            formData.append("colorImageFile", modalData.colorImageFile)
        }
        submit(formData, { replace: true, method: "PATCH", encType: "multipart/form-data" })
        handleModalChange()
        clearSelection()
    }

    const handleOnClickColorEdit = () => {
        const file = files.find(clr => clr.id === selectedResources[0])
        console.log('file', file)
        setModalActive(true)
        dispatchModalData({
            colorId: file.id,
            option_value_title: file.name,
            option_image_path: file.thumbnail,
            type: !!file?.type ? file.type.map(ct => ({ value: ct, label: ct })) : ''
        })
    }

    const handleOnClickColorDelete = () => {
        submit({ selectedResources: selectedResources }, { replace: true, method: "DELETE" })
        clearSelection()
    }

    const [queryValue, setQueryValue] = useState('')
    const handleFiltersQueryChange = useCallback(
        (value) => setQueryValue(value),
        [],
    );
    const onHandleCancel = () => {};

    const {mode, setMode} = useSetIndexFiltersMode()

    useEffect(() => {
        // const tabName = itemStrings[selectedTab]?.toLowerCase().replace(/ /g, "_")
        const tabName = itemStrings[selectedTab]?.value
        if (!!tabName && tabName != "All") {
            fetcher.load(`?query=${queryValue}&type=${tabName}`)
        } else {
            fetcher.load(`?query=${queryValue}`)
        }
    }, [queryValue])

    useEffect(() => {
        if (!!fetcher.data) {
            const newColors = fetcher.data?.data.length ? fetcher.data?.data.map(singleColor => ({
                id: singleColor._id,
                name: singleColor.name,
                type: singleColor.type,
                thumbnail: singleColor.filePath
            })) : []

            setFiles(newColors)

            console.log('fetcher', fetcher)

            if (!!fetcher?.data?.tabs?.length) {
                setItemStrings([
                    { value: 'All', label: 'All' },
                    ...fetcher.data.tabs.map(t => ({ value: t, label: t }))
                ])
            } else {
                setItemStrings([
                    { value: 'All', label: 'All' }
                ])
            }
        }

    }, [fetcher.data])

    return (
        <Page>
            <ui-title-bar title="Files page">
                <button variant="primary" onClick={handleModalChange} disabled={isLoading}>
                    Add File
                </button>
            </ui-title-bar>


            <IndexFilters
                queryValue={queryValue}
                queryPlaceholder="Searching in all"
                onQueryChange={handleFiltersQueryChange}
                onQueryClear={() => setQueryValue('')}
                cancelAction={{
                    onAction: onHandleCancel,
                    disabled: false,
                    loading: false,
                }}
                tabs={tabs}
                selected={selectedTab}
                onSelect={setSelectedTab}
                canCreateNewView={false}
                filters={[]}
                mode={mode}
                setMode={setMode}
            />


            <IndexTable
                resourceName={{
                    singular: 'file',
                    plural: 'files',
                }}
                itemCount={files.length}
                selectedItemsCount={ allResourcesSelected ? 'All' : selectedResources.length }
                onSelectionChange={(selectionType, isSelecting, selection) => {
                    clearSelection()
                    if ( ( selectionType === 'single' ) && (!!isSelecting) ) {
                        handleSelectionChange(selectionType, isSelecting, selection)
                    }
                }}
                headings={[
                    { title: '' },
                    { title: 'Name' },
                    { title: 'Type' }
                ]}
                // bulkActions={[{
                //     content: 'Delete',
                //     onAction: handleOnClickColorDelete
                // }]}
                promotedBulkActions={[
                    {
                        content: "Edit",
                        onAction: handleOnClickColorEdit
                    },
                    {
                        content: "Delete",
                        onAction: handleOnClickColorDelete
                    }
                ]}
                loading={isLoading}
            >
                {
                    files.map(
                        (
                            {id, name, type, thumbnail},
                            index,
                        ) => (
                            <IndexTable.Row
                                id={id}
                                key={id}
                                selected={selectedResources.includes(id)}
                                position={index}
                            >
                                <IndexTable.Cell>
                                    <Thumbnail source={`${thumbnail}`} />
                                </IndexTable.Cell>
                                <IndexTable.Cell>
                                    <Text variant="bodyMd" fontWeight="bold" as="span">
                                        {name}
                                    </Text>
                                </IndexTable.Cell>
                                <IndexTable.Cell>
                                    <Text variant="bodyMd" fontWeight="bold" as="span">
                                        {!!type && type.join(', ')}
                                    </Text>
                                </IndexTable.Cell>
                            </IndexTable.Row>
                        ),
                    )
                }
            </IndexTable>


            <Modal
                open={isModalActive}
                onClose={handleModalChange}
                title="Add File"
                primaryAction={{
                    content: modalData.colorId ? 'Update' : 'Save',
                    onAction: modalData.colorId ? handleColorUpdate : handleColorSave,
                    disabled: !modalData.option_value_title || !modalData.type.length
                }}
            >
                <Modal.Section>
                    <FormLayout>
                        <TextField
                            label="Name"
                            value={modalData.option_value_title}
                            onChange={handleChangeColorName}
                            autoComplete="off"
                        />

                        <CreatableSelect
                            isMulti
                            options={itemStrings}
                            onChange={handleSelectChange}
                            // onCreateOption={}
                            value={modalData.type}
                        />

                        <DropZone
                            accept="image/*"
                            errorOverlayText="File type must be image"
                            type="image"
                            allowMultiple={false}
                            onDrop={handleDropZoneDrop}
                        >
                            {
                                (modalData.colorImageFile) &&
                                <LegacyStack>
                                    <Thumbnail
                                        size="small"
                                        alt={modalData.colorImageFile.name}
                                        source={
                                            ['image/gif', 'image/jpeg', 'image/png'].includes(modalData.colorImageFile.type)
                                            ? window.URL.createObjectURL(modalData.colorImageFile)
                                            : NoteMinor
                                        }
                                    />
                                    <div>
                                        {modalData.colorImageFile.name}{' '}
                                        <Text variant="bodySm" as="p">
                                            {modalData.colorImageFile.size} bytes
                                        </Text>
                                    </div>
                                </LegacyStack>
                            }
                            {
                                (!modalData.colorImageFile && modalData.option_image_path) &&
                                <LegacyStack>
                                    <Thumbnail
                                        size="small"
                                        source={modalData.option_image_path}
                                    />
                                    <div>
                                        {modalData.option_image_path}
                                    </div>
                                </LegacyStack>
                            }
                            {(!modalData.colorImageFile && !modalData.option_image_path) && <DropZone.FileUpload />}
                        </DropZone>
                    </FormLayout>
                </Modal.Section>
            </Modal>
        </Page>
    )
}