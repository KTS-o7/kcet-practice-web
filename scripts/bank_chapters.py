"""Map Examon's chapter/topic labels onto the repo's corpus/chapters.json ids.

Examon groups 3,000+ KCET questions into ~59 coarse chapters ("Electrostatics",
"Redox & Electrochemistry"). The repo uses NCERT chapter granularity, so a few
chapters need splitting on the Examon `topic` field.

Every mapping below is explicit: no fuzzy matching, so a new Examon chapter
cannot silently land in the wrong bucket. Unmapped chapters raise KeyError.
"""

# Exact chapter -> repo chapter id.
EXACT = {
    # ---- physics -------------------------------------------------------
    "Units & Measurements": "units-and-measurement",
    "Laws of Motion": "laws-of-motion",
    "Work, Energy & Power": "work-energy-and-power",
    "Rotational Motion": "system-of-particles-and-rotational-motion",
    "Gravitation": "gravitation",
    "Kinetic Theory of Gases": "kinetic-theory",
    "Thermodynamics": "thermodynamics",
    "Current Electricity": "current-electricity",
    "Electromagnetic Waves": "electromagnetic-waves",
    "Ray Optics": "ray-optics-and-optical-instruments",
    "Wave Optics": "wave-optics",
    "Dual Nature of Matter & Radiation": "dual-nature-of-radiation-and-matter",
    "Semiconductor Devices": "semiconductor-electronics",
    # ---- chemistry -----------------------------------------------------
    "Some Basic Concepts": "some-basic-concepts-of-chemistry",
    "Atomic Structure": "structure-of-atom",
    "Classification & Periodicity": "classification-of-elements-and-periodicity",
    "Chemical Bonding & Molecular Structure": "chemical-bonding-and-molecular-structure",
    "General Organic Chemistry": "organic-chemistry-basic-principles-and-techniques",
    "Hydrocarbons": "hydrocarbons",
    "Equilibrium": "equilibrium",
    "Solutions": "solutions",
    "Chemical Thermodynamics": "thermodynamics",
    "Chemical Kinetics": "chemical-kinetics",
    "d- and f-Block Elements": "the-d-and-f-block-elements",
    "Coordination Compounds": "coordination-compounds",
    "Haloalkanes & Haloarenes": "haloalkanes-and-haloarenes",
    "Alcohols, Phenols & Ethers": "alcohols-phenols-and-ethers",
    "Aldehydes, Ketones & Carboxylic Acids": "aldehydes-ketones-and-carboxylic-acids",
    "Amines": "amines",
    "Biomolecules": "biomolecules",
    # ---- mathematics --------------------------------------------------
    "Complex Numbers & Quadratic Equations": "complex-numbers-and-quadratic-equations",
    "Trigonometric Functions": "trigonometric-functions",
    "Inverse Trigonometric Functions": "inverse-trigonometric-functions",
    "Binomial Theorem": "binomial-theorem",
    "Permutations & Combinations": "permutations-and-combinations",
    "Sequences & Series": "sequences-and-series",
    "Applications of Derivatives": "application-of-derivatives",
    "Integrals": "integrals",
    "Applications of Integrals": "application-of-integrals",
    "Differential Equations": "differential-equations",
    "Vectors": "vector-algebra",
    "Matrices": "matrices",
    "Determinants": "determinants",
    "Three-Dimensional Geometry": "three-dimensional-geometry",
    "Statistics": "statistics",
    "Mathematical Reasoning": "mathematical-reasoning",
    "Linear Programming": "linear-programming",
}

# Chapters split across two repo chapters. Each entry is an ordered list of
# (keywords, target); the first entry whose keywords appear in the topic wins.
# The final entry with no keywords is the catch-all.
SPLIT = {
    "Kinematics": [
        (["projectile", "relative velocity", "river-boat", "river crossing"], "motion-in-a-plane"),
        ([], "motion-in-a-straight-line"),
    ],
    "Properties of Solids & Liquids": [
        (["young", "elastic"], "mechanical-properties-of-solids"),
        ([], "mechanical-properties-of-fluids"),
    ],
    "Oscillations & Waves": [
        (["beat", "doppler", "standing wave", "string", "pipe", "sound"], "waves"),
        ([], "oscillations"),
    ],
    "Electrostatics": [
        (["capacitor", "dielectric", "energy stored", "energy density"], "electrostatic-potential-and-capacitance"),
        ([], "electric-charges-and-fields"),
    ],
    "Magnetic Effects of Current & Magnetism": [
        (["magnetic material", "susceptibility", "earth", "dip angle", "dip needle", "bar magnet"], "magnetism-and-matter"),
        ([], "moving-charges-and-magnetism"),
    ],
    "Electromagnetic Induction & AC": [
        (["rms", "lcr", "phaser", "phasor", "transformer", "power factor", "quality factor",
          "resonance", "average power", "capacitive reactance", "wattless"], "alternating-current"),
        ([], "electromagnetic-induction"),
    ],
    "Atoms & Nuclei": [
        (["radioactive", "decay", "binding energy", "mass defect", "q-value", "q value", "nuclear",
          "mean life", "half-life", "half life", "alpha", "beta decay", "fusion"], "nuclei"),
        ([], "atoms"),
    ],
    "Redox & Electrochemistry": [
        (["oxidation number", "balancing redox"], "redox-reactions"),
        ([], "electrochemistry"),
    ],
    "Sets, Relations & Functions": [
        (["greatest integer", "floor function", "ceiling function", "fractional part"], "limits-and-derivatives"),
        (["inverse function", "composition"], "relations-and-functions"),
        ([], "relations-and-functions-11"),
    ],
    "Limits, Continuity & Differentiability": [
        (["continuity", "continu", "differentiab", "ivt", "rolle", "mvt", "implicit",
          "chain rule", "piecewise"], "continuity-and-differentiability"),
        ([], "limits-and-derivatives"),
    ],
    "Coordinate Geometry (Lines, Circles, Conics)": [
        (["line", "slope", "distance from point", "angle between", "family of"], "straight-lines"),
        ([], "conic-sections"),
    ],
}

# Chapters whose split depends on the exact topic string, not on keywords.
# Keyed by lower-cased Examon topic.
TOPIC_EXACT = {
    "Sets, Relations & Functions": {
        "sets": "sets",
        "cardinality": "sets",
        "set operations": "sets",
        "de morgan": "sets",
        "venn diagrams": "sets",
        "three-set venn": "sets",
        "cartesian product": "sets",
        "power set": "sets",
        "relations": "relations-and-functions-11",
        "functions": "relations-and-functions-11",
        "domain": "relations-and-functions-11",
        "range": "relations-and-functions-11",
        "number of functions": "relations-and-functions-11",
        "number of onto": "relations-and-functions-11",
        "one-one onto": "relations-and-functions-11",
        "functions — injective/surjective": "relations-and-functions-11",
        "equivalence classes": "relations-and-functions-11",
        "counting reflexive relations": "relations-and-functions-11",
        "composition": "relations-and-functions",
        "inverse function": "relations-and-functions",
        "greatest integer": "limits-and-derivatives",
        "greatest integer identity": "limits-and-derivatives",
        "floor function": "limits-and-derivatives",
        "ceiling function": "limits-and-derivatives",
        "fractional part": "limits-and-derivatives",
        "functional equation": "limits-and-derivatives",
        "even/odd composition": "limits-and-derivatives",
        "range of rational function": "limits-and-derivatives",
    },
    "Probability": {
        "bayes theorem": "probability",
        "bayes' theorem": "probability",
        "bayes theorem with machine-defect data": "probability",
        "bayes theorem with special coins": "probability",
        "bayes — bag and ball": "probability",
        "total probability": "probability",
        "conditional probability": "probability",
        "conditional": "probability",
        "conditional probability with coins": "probability",
        "conditional committee selection": "probability",
        "binomial distribution": "probability",
        "binomial probability": "probability",
        "binomial — exactly k successes": "probability",
        "binomial — at least one": "probability",
        "binomial — at least k": "probability",
        "binomial mean/variance": "probability",
        "binomial — mean and variance": "probability",
        "binomial mode": "probability",
        "variance — binomial": "probability",
        "bernoulli trials": "probability",
        "expected value": "probability",
        "expectation of linear transform": "probability",
        "expected value — dice": "probability",
        "exactly one from each group": "probability",
        "exactly two successes": "probability",
        "basic probability": "probability-11",
        "basic": "probability-11",
        "sample space": "probability-11",
        "complement": "probability-11",
        "independent vs mutually exclusive": "probability-11",
        "independent events": "probability-11",
        "independent events — or/and": "probability-11",
        "independent events — union": "probability-11",
        "multiplication theorem": "probability-11",
        "compound events — without replacement": "probability-11",
        "drawing without replacement": "probability-11",
        "selection without replacement": "probability-11",
        "at least one desired selection": "probability-11",
        "conditional probability in cards": "probability-11",
        "conditional events in cards": "probability-11",
        "sign of the product": "probability-11",
        "probability of sum": "probability-11",
        "conditional — addition rule": "probability-11",
        "conditional probability for independent events": "probability-11",
        "independence check": "probability-11",
        "at least one — complement": "probability-11",
    },
}


def map_chapter(subject, chapter, topic):
    """Return the repo chapter id for an Examon chapter/topic pair."""
    if chapter in EXACT:
        return EXACT[chapter]
    exact_topic = TOPIC_EXACT.get(chapter, {})
    key = (topic or "").strip().lower()
    if key in exact_topic:
        return exact_topic[key]
    if chapter not in SPLIT:
        raise KeyError(f"unmapped Examon chapter: {subject} / {chapter!r} / {topic!r}")
    topic_l = key
    for keywords, target in SPLIT[chapter]:
        if not keywords:
            continue
        for kw in keywords:
            if kw in topic_l:
                return target
    for keywords, target in SPLIT[chapter]:
        if not keywords:
            return target
    raise KeyError(f"unmapped Examon topic: {subject} / {chapter!r} / {topic!r}")
