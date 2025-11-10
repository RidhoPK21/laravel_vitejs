import React, { useEffect, useRef } from "react";
import "trix";
import "trix/dist/trix.css";

const TrixEditor = ({ value, onChange, name, ...rest }) => {
    const trixEditor = useRef(null); // Ref untuk <trix-editor>
    const trixInput = useRef(null); // <-- TAMBAHKAN REF BARU ini untuk <input>

    // Hook 1: Berjalan sekali saat Mount
    // Ini untuk setup listener dan mengatur nilai awal
    useEffect(() => {
        if (!trixEditor.current) return;

        const handleChange = (event) => {
            if (onChange) {
                onChange(event.target.innerHTML);
            }
        };

        trixEditor.current.addEventListener("trix-change", handleChange);

        // Set nilai awal
        if (trixEditor.current.editor) {
            trixEditor.current.editor.loadHTML(value || "");
        }

        return () => {
            if (trixEditor.current) {
                trixEditor.current.removeEventListener(
                    "trix-change",
                    handleChange
                );
            }
        };
    }, []); // <-- Tetap kosong, hanya berjalan sekali

    // Hook 2: (BARU) Berjalan saat prop 'value' berubah
    // Ini khusus untuk menangani reset form dari parent
    useEffect(() => {
        // Jika nilai di parent di-reset jadi kosong
        if (value === "" || value === null) {
            // 1. Kosongkan editor visual Trix
            if (trixEditor.current && trixEditor.current.editor) {
                trixEditor.current.editor.loadHTML(value || "");
            }

            // 2. Kosongkan juga <input type="hidden"> secara manual
            //    Ini penting agar form submission berikutnya tidak mengirim data lama
            if (trixInput.current) {
                trixInput.current.value = "";
            }
        }
    }, [value]); // <-- Hook ini bergantung pada [value]

    return (
        <div className="trix-editor-wrapper">
            <input
                ref={trixInput} // <-- PASANG REF DI SINI
                id={rest.id || "trix-editor"}
                type="hidden"
                name={name || "content"}
                // Tetap gunakan defaultValue agar "sticky bold" tidak rusak
                defaultValue={value || ""}
            />
            <trix-editor
                ref={trixEditor}
                input={rest.id || "trix-editor"}
                {...rest}
                className="trix-content"
            />
        </div>
    );
};

export default TrixEditor;
