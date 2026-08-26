// =====================================================
// RACING ENGINEER V4.3 TRACK DATABASE
// =====================================================

const TRACKS = {

    spa: {
        name: "Spa-Francorchamps",
        country: "Belgium",

        notes: [

            {
                id: "spa-t1-brake",
                corner: "T1",
                type: "BRAKE",
                time: 18.2,
                call: "BRAKE HARD",
                detail: "Late apex",
                gear: "3",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t1-turn",
                corner: "T1",
                type: "TURN",
                time: 19.1,
                call: "TURN IN",
                detail: "Tight left",
                gear: "3",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t2",
                corner: "T2",
                type: "TURN",
                time: 22.5,
                call: "LEFT",
                detail: "Stay tight",
                gear: "3",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t3",
                corner: "T3",
                type: "APEX",
                time: 25.8,
                call: "APEX",
                detail: "Build throttle",
                gear: "4",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t4",
                corner: "T4",
                type: "TURN",
                time: 30.0,
                call: "RIGHT",
                detail: "Commit",
                gear: "5",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t5",
                corner: "T5",
                type: "BRAKE",
                time: 33.0,
                call: "BRAKE",
                detail: "Short stop",
                gear: "4",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t6",
                corner: "T6",
                type: "TURN",
                time: 35.0,
                call: "LEFT",
                detail: "Clip apex",
                gear: "4",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t7",
                corner: "T7",
                type: "EXIT",
                time: 38.0,
                call: "THROTTLE",
                detail: "Open the steering",
                gear: "4",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t8",
                corner: "T8",
                type: "BRAKE",
                time: 42.0,
                call: "BRAKE",
                detail: "Les Combes",
                gear: "4",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t9",
                corner: "T9",
                type: "TURN",
                time: 44.0,
                call: "RIGHT",
                detail: "Stay patient",
                gear: "3",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t10",
                corner: "T10",
                type: "TURN",
                time: 46.0,
                call: "LEFT",
                detail: "Early throttle",
                gear: "3",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t11",
                corner: "T11",
                type: "BRAKE",
                time: 58.0,
                call: "BRAKE",
                detail: "Hairpin",
                gear: "2",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t12",
                corner: "T12",
                type: "EXIT",
                time: 61.0,
                call: "POWER",
                detail: "Full throttle",
                gear: "3",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t13",
                corner: "T13",
                type: "TURN",
                time: 68.0,
                call: "RIGHT",
                detail: "Medium speed",
                gear: "5",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t14",
                corner: "T14",
                type: "TURN",
                time: 71.0,
                call: "LEFT",
                detail: "Carry speed",
                gear: "5",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t15",
                corner: "T15",
                type: "BRAKE",
                time: 77.0,
                call: "BRAKE",
                detail: "Bus Stop entry",
                gear: "3",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t16",
                corner: "T16",
                type: "TURN",
                time: 79.0,
                call: "LEFT",
                detail: "Aggressive",
                gear: "2",
                enabled: true,
                voice: true
            },

            {
                id: "spa-t17",
                corner: "T17",
                type: "TURN",
                time: 81.0,
                call: "RIGHT",
                detail: "Back on power",
                gear: "2",
                enabled: true,
                voice: true
            }

        ]
    },


    bahrain: {
        name: "Bahrain",
        country: "Bahrain",
        notes: []
    },

    jeddah: {
        name: "Jeddah",
        country: "Saudi Arabia",
        notes: []
    },

    australia: {
        name: "Australia",
        country: "Australia",
        notes: []
    },

    japan: {
        name: "Japan",
        country: "Japan",
        notes: []
    },

    miami: {
        name: "Miami",
        country: "United States",
        notes: []
    },

    imola: {
        name: "Imola",
        country: "Italy",
        notes: []
    },

    monaco: {
        name: "Monaco",
        country: "Monaco",
        notes: []
    },

    canada: {
        name: "Canada",
        country: "Canada",
        notes: []
    },

    austria: {
        name: "Austria",
        country: "Austria",
        notes: []
    },

    britain: {
        name: "Great Britain",
        country: "United Kingdom",
        notes: []
    },

    hungary: {
        name: "Hungary",
        country: "Hungary",
        notes: []
    },

    belgium: {
        name: "Belgium",
        country: "Belgium",
        notes: []
    },

    netherlands: {
        name: "Netherlands",
        country: "Netherlands",
        notes: []
    },

    italy: {
        name: "Italy",
        country: "Italy",
        notes: []
    },

    azerbaijan: {
        name: "Azerbaijan",
        country: "Azerbaijan",
        notes: []
    },

    singapore: {
        name: "Singapore",
        country: "Singapore",
        notes: []
    },

    usa: {
        name: "United States",
        country: "United States",
        notes: []
    },

    mexico: {
        name: "Mexico",
        country: "Mexico",
        notes: []
    },

    brazil: {
        name: "Brazil",
        country: "Brazil",
        notes: []
    },

    lasvegas: {
        name: "Las Vegas",
        country: "United States",
        notes: []
    },

    qatar: {
        name: "Qatar",
        country: "Qatar",
        notes: []
    },

    abudhabi: {
        name: "Abu Dhabi",
        country: "United Arab Emirates",
        notes: []
    }

};
