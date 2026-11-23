# Questions that need a human look

Flagged = hidden from practice until fixed. A question is live only when a blind solver agreed with its answer key.
Fix by editing the question's JSON in corpus/questions/ (stem/options/answer/status), committing, and deploying.
Note: re-running scripts/assemble.py rebuilds PYQ/Exemplar/NEET files from work/ and would undo such hand edits; check `git diff corpus/` before committing.

| Question | Status | Why | Source | Key | Checker |
|---|---|---|---|---|---|
| tp-ncert-math-12-ch09-035 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep209.pdf p.17 | C | Squaring gives (1+p^2)^3=(y'')^2, polynomial in derivatives, degree 2; 'not defined' is wrong (NCERT key erratum). |
| tp-ncert-math-12-ch09-042 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep209.pdf p.18 | A | y=Ax+A^3 with A=y' gives y=xy'+y'^3, degree 3; key A (1) is wrong. |
| tp-ncert-math-12-ch09-045 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep209.pdf p.19 | B | General solution y+1=C(x-1) gives y(1)=-1, never 2, so no solution; key B (one) is wrong. |
| tp-ncert-phys-11-ch02-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep302.pdf p.1 | (b) | Transcription and key reading both verified (key says 2.2 (b) 664). Sum 663.821 must be rounded to least decimal places (227.2 has one) giving 663.8 (option c); printed key appears wrong. |
| tp-ncert-phys-11-ch03-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep303.pdf p.2 | A | Key (a) x<0 is impossible: lift is at 4th-8th floor above origin so x>0; moving down v<0; about to stop so a>0 => option (c). Transcription and key reading (3.2 (a)) both confirmed; printed key appears to be an NCERT erratum. |
| tp-ncert-phys-11-ch04-009 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep304.pdf p.3 | C | Key (c) read correctly from printed key, but (c) is true ((AxB)xC is perpendicular to plane normal so lies in plane); (b) is false since A+B+C=0 makes (AxB).C=0 always. NCERT key error. |
| tp-ncert-phys-11-ch04-010 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep304.pdf p.3 | B | Key (b) read correctly, but /A+B/=/A/ gives A.B=-B^2/2<=0, so only (d) necessarily follows; antiparallel is just a special case (B=-2A) not necessary. |
| tp-ncert-phys-11-ch06-013 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep306.pdf p.5 | D | Transcription matches page; key (d) read correctly from text layer, but (d) is an undamped oscillating curve going negative. Total mechanical energy of a damped pendulum decreases monotonically to zero and is never negative, so (c) is correct; key looks wrong. |
| tp-ncert-phys-12-ch01-007 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep101.pdf p.3 | A | Key image reads 1.7 (a) (official NCERT answer), transcription correct. But all charge lies on one side of the flat-face plane, so at an outside point on a diameter the field has radial and out-of-plane components; not perpendicular, tilted away from the diameter (d). Official key is likely idealised/wrong. |
| tp-ncert-phys-12-ch08-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep108.pdf p.1 | (b) | Key image reads 8.2 (b) (confirmed). Transcription matches page. Perfect reflector needs E=0 at wall, so reflected wave is -E0 i cos(kz+wt), option (c); (b) has no phase flip. |

## Transcriber notes (informational)

- **pyq-2008-chemistry**: Q85 option 4: printed as Pl(NH3)4 Cl2 (probably a typo for Pt); kept as printed.
- **pyq-2008-chemistry**: Q111: key is G (grace mark), so no correct option is recorded (options: []).
- **pyq-2008-chemistry**: Q93: key is 23, meaning options 2 and 3 are both correct (stored as 0-indexed [1,2]).
- **pyq-2008-mathematics**: Q50 option 2 is printed truncated as 'is not differentiable at x' (cut off at the page edge); transcribed as printed.
- **pyq-2008-mathematics**: Q11 option 2 prints 'w' for the cube root of unity; transcribed as \omega.
- **pyq-2008-mathematics**: job.json key_pdfs points to the physics key PDF, but that PDF holds all four subjects. The mathematics page (k0-3) was used and matches key_a/key_b for all 60 answers.
- **pyq-2009-chemistry**: Q29 key lists two accepted options (A and B) per the official key; kept as is
- **pyq-2009-chemistry**: Q44 key is grace (G, no option); kept as grace with empty options
- **pyq-2009-mathematics**: Q13: paper prints digit 1 where q is evidently intended; transcribed as printed (1), flagged in notes
- **pyq-2009-mathematics**: Q57: printed typo 'orign' kept as printed
- **pyq-2009-mathematics**: Q8 (13), Q53 (24) multiple-answer keys; Q13, Q45, Q60 grace-mark keys (no single answer), recorded as in official key
- **pyq-2009-physics**: Q60: official key is G (grace mark), no option key; recorded as empty options with grace=true
- **pyq-2010-mathematics**: Q22: key is G (grace mark), no option recorded
- **pyq-2010-mathematics**: Q27: key is 123 (multiple options 1, 2, 3 correct)
- **pyq-2010-mathematics**: Job.json key_pdfs points at the physics key file, but the same PDF contains the maths key (k0-3.png); the maths page was used and agrees with key_a/key_b
- **pyq-2010-physics**: Q30: option 4 is clipped at the right margin of the scan (prints 'phase difference of pi/' plus a cut-off character). Transcribed as pi/2 and noted in the notes field.
- **pyq-2010-physics**: Q60: stem prints 'radius ... = 0.53 A' with no visible ring over the A. Transcribed as angstrom to match the options, and noted in the notes field.
- **pyq-2010-physics**: Q36 and Q58: key is 'G' (grace mark) with no option. Stored as options [] and grace true, same as key_a.json.
- **pyq-2010-physics**: Q59: the gate shapes in the figure look like NOR gates (curved OR shape with an output bubble). The question and options are transcribed as printed, and the figure is cropped.
- **pyq-2011-mathematics**: Key: Q14, Q33, Q53, Q55 are 'G' (grace mark) for version A1; key.json has empty options and grace=true for them.
- **pyq-2011-mathematics**: Q3 prints 'In n is an odd...' (likely a misprint of 'If'); transcribed as printed.
- **pyq-2011-mathematics**: Q23 option 1 and Q59 options 1 and 3 print oddly (no fraction bar, no y factor, 'k tan kn'); transcribed as printed.
- **pyq-2011-mathematics**: No diagrams are needed in this paper; no crops were made.
- **pyq-2011-physics**: Q36: image shows a comma-like mark or speck after 'blue' (OCR read ';'); transcribed as a comma and noted in the question's notes field.
- **pyq-2011-physics**: Q13 and similar stems: trailing blank dotted lines ('.......') are omitted, matching the other questions in the extract.
- **pyq-2012-physics**: Q39: key shows G (grace mark), so no single correct option is recorded.
- **pyq-2012-physics**: Q25: provisional key says 2, the final A1 key says 1. I used the final key, option 1.
- **pyq-2012-physics**: Q15, Q4, Q17, Q39, Q48 and Q51: diagram crops are complete but include a sliver of neighbouring text at the edge.
- **pyq-2012-physics**: Q23 and Q28: I did not view the page image for these. Blank dots are copied from extract B and may differ in dot count.
- **pyq-2013-physics**: Q21: options 2-4 are printed as mixed-number style (coefficient beside stacked theta/denominator) and are transcribed as 2\frac{\theta}{3} etc.; the layout is ambiguous, but the official key says option 1 is correct, so it does not affect grading.
- **pyq-2013-physics**: Key: Q6, Q24, Q30, Q31, Q37 and Q40 are grace-mark (G) entries with no option in the official A1 key. Q1, Q4, Q16 and Q43 have multiple correct options (24, 23, 34, 134).
- **pyq-2014-chemistry**: Q7 and Q43: the official key gives two correct options (7: options 1 and 2; 43: options 1 and 3), copied as printed.
- **pyq-2014-chemistry**: Q10, 16, 20, 27, 31, 54, 57, 59 and 60: the official key shows G (grace mark), so key.json has no option for them (options [], grace true).
- **pyq-2014-chemistry**: Q31 (BCl2), Q27 (Kb = 4.74), Q59 (missing mass of coke) and Q20 (1/T vs k) look like printing errors in the paper. They are transcribed as printed.
- **pyq-2014-mathematics**: Q38: printed text has typo 'comlex' for 'complex'; kept as printed (noted in notes)
- **pyq-2014-mathematics**: Key: Q5, Q15, Q35 are 'G' (grace, all options accepted) and multi-answer entries (Q12, Q21, Q41, Q53) kept as in the official key; no key discrepancies between extractors
- **pyq-2015-mathematics**: Q15: printed second direction cosine is -9/3 (digit 9 clearly legible, transcribed as printed); no option fits it, so it looks like a paper error. The key gives a grace mark (G).
- **pyq-2015-mathematics**: Q10: key gives a grace mark (G). Stem prints (-p) with a short dash, transcribed as (-p).
- **pyq-2015-mathematics**: Q29: key value '14' means options 1 and 4 are both correct (multiple answers). Stored as options [0,3].
- **pyq-2015-mathematics**: Q9: the options print the inequations separated only by spacing, no commas. Transcribed with \quad.
- **pyq-2015-mathematics**: key_pdfs in job.json points to the physics key file. The maths key is page k0-3 (ANSWER KEYS - MATHS). key.json matches that page, and compare_keys.py reported 0 issues.
- **pyq-2015-physics**: Q19 and Q44: the key marks both as grace (G, no option). Both extracts agree and compare_keys found no issues, so I kept them. I did not re-check the key images.
- **pyq-2015-physics**: Q2: the graph shows 40 degrees from the velocity axis, and option 2 prints tan 50 degrees. I transcribed both as printed.
- **pyq-2015-physics**: Q50: the stem has a punctuation difference between extracts (comma vs period after n = 2). The image shows a comma, so I used that.
- **pyq-2016-mathematics**: Q46: official key A1 lists 134 (multiple correct answers: options 1, 3, 4); stored as options [0,2,3]
- **pyq-2016-physics**: Q16: official key is G (grace mark awarded, no single correct option); key.json has options [] and grace true
- **pyq-2016-physics**: Q50: official key is 1234 (all four options accepted); key.json has options A-D
- **pyq-2016-physics**: Q49/Q50: wavelength unit printed as 'ηm' (typo for nm); transcribed as nm, noted in notes
- **pyq-2016-physics**: Q42: printed 'discipated' kept as printed
- **pyq-2016-physics**: Q8: options are graph images; option strings are (A)-(D) in printed (1)-(4) order
- **pyq-2017-chemistry**: Q5: key is 'BC' (two options accepted) per official key
- **pyq-2017-chemistry**: Q27: key is 'AB' (two options accepted) per official key
- **pyq-2017-chemistry**: Q48 and Q60: key is GRACE (no single answer)
- **pyq-2017-chemistry**: Q37, Q56 and Q58: printed oddities kept as printed (superscript + in Q37 A and D, 'pyridoxime' in Q56 B, '-CO-' in Q58 A)
- **pyq-2017-mathematics**: Q19: official key is GRACE (no single answer; options left empty in key.json)
- **pyq-2017-mathematics**: Q33: official key lists multiple answers ACD (options [0,2,3])
- **pyq-2017-physics**: Q1: official key is GRACE (no single correct option), so key.json has an empty options list with grace=true
- **pyq-2019-chemistry**: Q50: official key for A1 is '34' (multiple correct answers, options C and D), encoded as options [2,3]
- **pyq-2019-chemistry**: Q59: printed symbol after 'molar mass of' looks like A with a ring; kept as 'Å'
- **pyq-2019-chemistry**: Q34: stem has no trailing 'is' or period in print; transcribed without either
- **pyq-2019-mathematics**: Official A1 key marks Q4, Q9 and Q48 as G (grace). The printed questions look flawed for all three, so no answer option is recorded for them.
- **pyq-2019-mathematics**: Several printed questions have an answer that is not among the options as I computed it. These are Q4, Q28, Q48 and Q49. I transcribed all of them as printed and did not correct them.
- **pyq-2019-physics**: Q26: official key gives grace mark (G) for A1, so no correct option recorded (options: [], grace: true)
- **pyq-2019-physics**: Q36: printed stem does not define source voltage V used in the options (transcribed as printed)
- **pyq-2019-physics**: Q12: figure crop includes the printed line 'Which of the following graph shows...' between the v-x graph and the option graphs
- **pyq-2019-physics**: Q50 and Q56: options/blank transcribed to match the printed layout, flagged in notes
- **pyq-2020-physics**: Q10 option B: a stray dot sits left of and above 'q' in '- q/24 eps0' on the scan. Transcribed as q/(24 eps0). It could be a minus sign.
- **pyq-2020-physics**: Q11: all four options print the unit V m^-1 although the question asks for a force. Transcribed as printed.
- **pyq-2020-physics**: Q6, Q37, Q47, Q56: the printed wording is grammatically incomplete or odd. Kept as printed.
- **pyq-2020-physics**: Q12, Q47: key shows G (grace mark) only in column A1. key.json stores options [] with grace=true for these.
- **pyq-2020-physics**: Q57: kept the printed typo 'bicycles'.
- **pyq-2021-chemistry**: Q20, Q28, Q33, Q36, Q53: printed typos or garbled wording kept verbatim (see notes in questions.json)
- **pyq-2021-chemistry**: Q47: printed H_gSO_4 in the figure, kept as printed; the figure is cropped as an image
- **pyq-2021-chemistry**: Q17 crop: the figure is slightly tight, with a few stray letters of neighbouring text at the edges
- **pyq-2022-mathematics**: Q4, Q40, Q48: paper prints 'NO OPTION' as the answer; the official key gives grace (G) for Q4 (D3), so key.json has no option for it. Q40 and Q48 key entries were not re-checked beyond the compare (only Q11 differed).
- **pyq-2022-mathematics**: Q38: official key is 1234 (all options correct)
- **pyq-2022-mathematics**: Q59: options 2 and 3 are identical as printed
- **pyq-2022-mathematics**: Q11 key: A read 4 and B read 3. The key image shows D3=3 (option 3), so key.json uses 3.
- **pyq-2022-mathematics**: No diagrams are needed, so img/ is empty.
- **pyq-2022-physics**: Q15: official key B3 is G (grace mark), so key.json has an empty option list with grace=true and no answer option.
- **pyq-2022-physics**: Q13 and Q20: the printed values do not match any option exactly. Both are transcribed as printed and flagged in notes. Q20's key answer is option 2, and the paper's own solution (14.4e-13 N) disagrees with every option.
- **pyq-2022-physics**: Q41: the ray diagram is in the answer-solution column, not with the question, so no crop was made.
- **pyq-2022-physics**: Q7: no figure is printed with the question.
- **pyq-2023-physics**: Q12: printed solution m^2E^2/(qB^3) matches no option and the paper says 'No answer'; the official key gives grace marks (G), so key.json has no option for it.
- **pyq-2023-physics**: Q41: official key lists two correct options (A and C); recorded as [0, 2].
- **pyq-2023-physics**: Q22: the paper's own printed answer is C (0.4), but the official KEA key says 4 (option D, 2.5). I used the official key.
- **pyq-2023-physics**: Q3, Q7, Q21 and Q50: printed stems end without a question phrase. Transcribed as printed.
- **pyq-2024-chemistry**: Q55: key value is 204 (multiple answers correct) and the key does not name the options. key.json stores B (Sb) and D (Se) by inference, matching both extracts. This is unverified.
- **pyq-2024-chemistry**: Q9: options are images (img/pyq-2024-chemistry-009.png). A handwritten circle and tick on option (A) overlaps the label and could not be cropped out.
- **pyq-2024-chemistry**: Q1-4, Q31-33, Q43-48 and Q50-51 are '7' (excluded) in the A2 key column. They are stored as grace with empty options.
- **pyq-2024-chemistry**: Q53: the printed codes table has only i/ii/iii per column. The options are written as 'I – i, II – ii, III – iii' to be self-contained, which is not word-for-word as printed.
- **pyq-2024-chemistry**: Q24: each option is printed on two lines. Both lines are joined with '; ' in one option string.
- **pyq-2024-mathematics**: Q11: end of f(x) is hidden by a QR code on the scan. Visible text is 'x (x -' and the text layer gives 'x (x-1'. I wrote x(x-1)^2, with the exponent inferred because it makes option B (4/3) correct. The official key marks Q11 as excluded (7).
- **pyq-2024-mathematics**: Key: 22 questions have an empty options list in key.json (1, 4, 11, 22, 23, 24, 28, 30, 32, 33, 34, 35, 37, 38, 39, 55 and others). The A2 column prints 7 (excluded) for most of them and 0 for Q4, which key.json stores as grace=true. I compared key.json to the key image and all 60 A2 values match.
- **pyq-2024-mathematics**: Q24: decimals are printed as middle dots (0·2) and were kept as printed.
- **pyq-2024-mathematics**: Q29: the modulus bars around a+b are not printed, so the stem was left as printed.
- **pyq-2024-physics**: Q32: word 'A' after 'due to' is hidden by a QR code in the print; restored as 'due to A'
- **pyq-2024-physics**: Q48: printed spelling 'hysterisis' kept as printed
- **pyq-2024-physics**: Key: Q2,4,11,14,43,48,49,54,57 are excluded (code 7, grace true, no options); Q50 grace mark (code 0); Q22 has two correct options (3 and 4)
- **pyq-2025-physics**: Q1: final KEA key marks GRACE (provisional key said option D); key.json has empty options with grace=true
- **pyq-2025-physics**: Q16: the paper prints no figure for the two paths A to B, so none was cropped
- **pyq-2025-physics**: Q55: each option prints rho and sigma on two lines with no separator; transcribed with a comma between them
- **pyq-2025-physics**: Several diagram crops include a thin sliver of neighbouring text at the edge; every figure is complete
- **pyq-2026-chemistry**: Q48: the final KEA key marks Q48 (chemistry A1) as GRACE. The provisional key said option 1. I recorded it as grace with no option (options: [], grace: true), as key_a did. The pipeline needs to decide how to score grace.
- **pyq-2026-chemistry**: Q11 and Q12: the printed structures are written as linear chain formulas in LaTeX. Q11 also has a crop of the drawn structure. Q12 has no crop.
- **pyq-2026-chemistry**: Q39 and Q19: the drawn structures are in the crop images. The Q39 stem marks them '(see diagram)'. Q19 uses options_are_images with the labels (A) to (D).
- **pyq-2026-physics**: Q13: official key gives GRACE (all candidates get the marks), so key.json has empty options with grace=true.
- **pyq-2026-physics**: Q42 option A is printed as 'B l x' (x, not v). I kept it as printed.
- **pyq-2026-physics**: Q1, Q23, Q46 and Q47 stems keep the printed 'Codes:' line (extract A's version).
- **pyq-2026-physics**: Q36 options are typeset formulas. I transcribed them as text (extract B's version) and set options_are_images=false. The crop covers the figure only.
- **pyq-2026-physics**: Kannada parallel text was not transcribed. English pages only.
- **pyq-2026-physics**: Q36, Q59 and a few other crops have thin slivers of neighbouring text at an edge. I judged these harmless.
- **tp-ncert-chem-11-ch03**: Q12 is a comprehension with five sub-parts (a)-(e), transcribed as five entries all numbered 12 (page 3/4), so numbers are not unique. Key entry '12' has options [] and an extra 'parts' field: a=iii(2), b=iii(2), c=iii(2), d=i(0), e=ii(1). The downstream importer needs to handle this.
- **tp-ncert-chem-11-ch03**: Q7: options (ii) and (iv) are identical as printed (F < Cl < Br < I); kept as printed. Key says (iii).
- **tp-ncert-chem-11-ch07**: Q11 option D is printed as CH4COONa (typo in source for CH3COONa); transcribed as printed
- **tp-ncert-chem-12-ch09**: Q2: options (i) and (iv) are identical as printed in the source; key says (iii). Transcribed as printed.
- **tp-ncert-math-11-ch01**: Q33 stem refers to a square/triangle/circle but the page prints no figure; none cropped
- **tp-ncert-math-11-ch01**: Q39: sets A and B are printed on one line with no connecting word; kept as printed
- **tp-ncert-math-11-ch01**: Q41: expression has unbalanced parentheses as printed; kept as printed
- **tp-ncert-math-11-ch02**: Q32: options C and D are identical in the printed source (both Domain = [1, inf), Range = [0, inf)); key says C.
- **tp-ncert-math-11-ch02**: Q35: options A and B are identical in the printed source; key says A.
- **tp-ncert-math-11-ch13**: Q59: options B and D both printed as 1 (kept as printed; key says C)
- **tp-ncert-math-11-ch13**: Q58: printed limit is x->0 but expression in theta (kept as printed)
- **tp-ncert-math-11-ch16**: Q27: option B printed with a blank gap before '.5' (symbol, probably '=', missing in the scan); transcribed as '.5'. Key answer is C so no impact on the key.
- **tp-ncert-math-12-ch01**: Q45: option B printed as '1' (identical to A; likely a lost minus sign in source) - transcribed as printed
- **tp-ncert-math-12-ch01**: Q44/Q45: fourth option labelled (B) in print - transcribed in printed order
- **tp-ncert-math-12-ch02**: Q31: printed text reads 'x in ]0, 1, then' (closing bracket missing, likely a misprint of ]0,1[); transcribed as printed.
- **tp-ncert-phys-11-ch12**: Q1, Q3, Q4 diagram crops: edge fragments of neighbouring text still show (Q1 has 'he/ic/ch' at left and 'This is' at the bottom). The figures are complete.
- **tp-ncert-phys-11-ch12**: Q2 key is (a) 0.25 kg, but 14.5/580 = 0.025. The printed option and the key both say 0.25, so I kept them as printed.
- **tp-ncert-phys-11-ch14**: Q1 option A printed as '2p/w' (typo for 2pi/omega in the source); transcribed as printed
- **tp-ncert-phys-11-ch14**: Q9 stem printed as cos(alpha t)^2; transcribed as printed
- **tp-ncert-phys-12-ch11**: Q4 refers to Fig. 11.7 of the NCERT textbook, which is not printed on these pages, so it has no diagram crop.
- **tp-neet-2019-chemistry**: Q51: the official NTA key gives option 4 (30 J), but the Aakash solution in the paper says answer (1) (-30 J). I used the official key (key.json). The printed answer looks like a key error, so check this.
- **tp-neet-2019-chemistry**: Q72: the official key is 'A', which means options 1 and 2 are both accepted. key.json has options [0, 1].
- **tp-neet-2022-chemistry**: Q93: NTA key lists option id 5 (dropped/no valid answer; printed E°cell = 10.5 V). key.json has options [] with grace true, raw '5'.
- **tp-neet-2022-chemistry**: Q67: options 3 and 4 are structure images; set options_are_images true with option strings (A)-(D), and the crop includes all four options.
- **tp-neet-2022-chemistry**: Q72: options 3 and 4 explanatory text is printed on separate lines to the right of the equation; joined with commas.
- **tp-neet-2025-chemistry**: Q63: official key accepts options 1 and 2 (raw '1,2'); kept both as printed in key
