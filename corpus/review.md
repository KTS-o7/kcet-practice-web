# Questions that need a human look

Flagged = hidden from practice until fixed. Disputed = live (official KEA key), but the AI checker disagreed.
Fix by editing the question's JSON in corpus/questions/ (stem/options/answer/status) and redeploying.

| Question | Status | Why | Source | Key | Checker |
|---|---|---|---|---|---|
| pyq-2008-chemistry-116 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2008/chemistry/2008-chemistry-question_paper-A1-indcareer.pdf p.13 | 2 | Key cell re-read as 2 (confirmed on image) and transcription exact, but insulin has 3 disulphide linkages (2 inter-chain, 1 intra-chain in A), so option 3; key appears wrong. |
| pyq-2009-chemistry-022 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2009/chemistry/2009-chemistry-question_paper-A1-aglasem.pdf p.6 | B | Key cell A1 Q22 read correctly as 2 (800-1000 C); transcription exact. Standard textbook: slag formation zone is 1200-1500 C, 800-1000 C is lower reduction zone; some sources differ, so key may follow a different textbook. |
| pyq-2010-physics-003 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2010/physics/2010-physics-question_paper-A1-aglasem.pdf p.2 | 3 | Key cell (A1 Q3 = 3, both a and b) re-read correctly; transcription matches. Relative to the table the ball stays put without friction (a) and is dragged slightly forward with friction, so b (moves left) is false; only a) is physically correct. |
| pyq-2010-physics-033 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2010/physics/2010-physics-question_paper-A1-aglasem.pdf p.8 | 4 | Key cell (A1 Q33 = 4, i.e. 17) re-read correctly; transcription matches. d=5 um, d/lambda=8 so n=8 falls at 90 deg and is not observable; maxima n=0,+-1..+-7 = 15. Key apparently counted n=+-8. |
| pyq-2014-mathematics-055 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2014/mathematics/2014-mathematics-question_paper-A1-aglasem.pdf p.14 | 3 | Key cell A1=3 read correctly (option -1/3). Slope at (1,2) is 3, so the angle with the y axis has tan = 1/3 (acute); -1/3 would need the obtuse angle. Transcription verified against image. |
| pyq-2015-chemistry-002 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2015/chemistry/2015-chemistry-question_paper-A1-kea-wayback.pdf p.2 | 1 | Key cell reads 1 (confirmed). On charging, PbSO4 at the anode (positive plate) is oxidized to PbO2; option 1 (anode reduced to Pb) is chemically wrong. |
| pyq-2015-chemistry-013 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2015/chemistry/2015-chemistry-question_paper-A1-kea-wayback.pdf p.4 | 1 | Key cell reads 1 (confirmed). Cu has LESS affinity for O than S (Cu2S stays while FeS oxidises); option 1 states the reverse, so key looks wrong; option 3 is correct. |
| pyq-2015-physics-003 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2015/physics/2015-physics-question_paper-A1-aglasem.pdf p.2 | 1 | Transcription exact. R=2H gives tan(theta)=2, R=4v^2/5g (option 3); key option 1 (v^2/g) is the max range, which would need R=4H. Key read correctly in both key files. |
| pyq-2015-physics-015 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2015/physics/2015-physics-question_paper-A1-aglasem.pdf p.5 | 1 | Key option 1 (4 and 3) counts the two end nodes; strictly between the ends the 3rd harmonic has 2 nodes and 3 antinodes (option 4). Key read correctly; transcription exact. |
| pyq-2015-physics-030 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2015/physics/2015-physics-question_paper-A1-aglasem.pdf p.9 | 4 | Key option 4 (both positive and negative). Standard textbook answer is only positively charged particles, though negative ions can in principle be accelerated. Key read correctly in both files; transcription exact. |
| pyq-2017-chemistry-007 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2017/chemistry/2017-chemistry-question_paper-C-aglasem.pdf p.3 | B | Key reading confirmed (B). Transcription exact. Rate follows Arrhenius (rises with T); signs of dH/dS give no basis for rate to rise on cooling, so key B looks wrong. |
| pyq-2017-chemistry-010 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2017/chemistry/2017-chemistry-question_paper-C-aglasem.pdf p.4 | B | Key reading confirmed (B). Transcription exact (printed ClO- on both sides). Cl goes +1 to -1 and +1 (printed as ClO-): disproportionation (C); key B Reduction looks wrong. |
| pyq-2018-chemistry-031 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2018/chemistry/2018-chemistry-question_paper-A-aglasem.pdf p.13 | C | Key cell (col A) reads 3 = (C) 6 correctly; but fcc corner is shared by 8 cells and face by 2, so 6 has no clear basis; question is ill-posed. |
| pyq-2019-physics-034 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2019/physics/2019-physics-question_paper-A1-aglasem.pdf p.17 | 2 | Key image A1 Q34 = 2 (B, -0.50) read correctly; transcription exact. Constant-volume wire gives Poisson ratio +0.5, and -0.5 is unphysical for this case, so the official key looks wrong. |
| pyq-2021-physics-035 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2021/physics/2021-physics-question_paper-A1-aglasem.pdf p.17 | 3 | Key cell (A1, Q35) reads 3 = option C (concentric circles), read correctly; transcription is fine (options are images). Concentric circles cannot be a static electric field (non-conservative), whereas the dipole loop pattern D is valid for both electric and magnetic dipoles, so D looks correct. |
| pyq-2023-physics-052 | disputed (live) | official key kept; Sonnet disagrees | sources/pyq/2023/physics/2023-physics-question_paper-A4-collegedekho.pdf p.10 | 1 | Key cell A4 re-read as 1 (option A, total energy) and transcription is exact; but P = (2/3)(N/V)<KE> so average kinetic energy (B) is the direct answer (for an ideal gas total energy = KE too, so A is also arguable); third-party solution on the paper page also says B. |
| tp-ncert-chem-11-ch03-012a | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.3 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012b | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.3 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012c | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.3 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012d | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.4 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012e | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.4 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch06-011 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-11/keep506.pdf p.3 | C | Key (iii) x>y read correctly from image; but (a) is reverse atomisation of CH4 (about -1665 kJ/mol) vs formation y (about -75), so x<y; printed key justification only holds for magnitudes. |
| tp-ncert-chem-11-ch07-008 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-11/keep507.pdf p.2 | iv | Key (iv) read correctly from answers text layer, but higher Ka means lower pH; Ka formic > acetic > HOCl so pH order is HOCl > acetic > formic = option (ii); key (iv) lists the Ka order, not pH. |
| tp-ncert-chem-11-ch12-001 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-11/keep512.pdf p.1 | B | Key (ii) read correctly from NCERT answer page, but IUPAC requires alphabetical order (ethyl before dimethyl) so 3-Ethyl-4,4-dimethylheptane (i) is the correct name; (ii) lists substituents non-alphabetically. Official key appears wrong. |
| tp-ncert-chem-12-ch02-020 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-12/leep502.pdf p.4 | (iii) | Key (iii) i_A=i_B=i_C is wrong: NaCl dissociation increases on dilution so i rises, iA<iB<iC (option i). Transcription and key reading verified. |
| tp-ncert-chem-12-ch02-023 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-12/leep502.pdf p.5 | (i) | Key (i) A-B stronger is wrong: minimum boiling azeotrope arises from positive deviation, i.e. weaker A-B interactions (option iv). Transcription and key reading verified. |
| tp-ncert-chem-12-ch02-025 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-12/leep502.pdf p.6 | (ii) | Key (ii) maximum boiling with positive deviation is self-contradictory; positive deviation gives minimum boiling azeotrope (option i). Transcription and key reading verified. |
| tp-ncert-chem-12-ch03-015 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-12/leep503.pdf p.3 | (i) | Key reads (i) correctly, but on charging (electrolytic mode) the Pb plate is the cathode where PbSO4 is reduced to Pb; (i) calls it anode, which is wrong in electrolytic convention (known NCERT key issue). |
| tp-ncert-chem-12-ch03-017 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-12/leep503.pdf p.4 | (ii) | Key reads (ii) correctly, but Cl- oxidation (iv) is the actual anode reaction in brine electrolysis; the book's own answer to Q34 says Cl- is oxidised instead of water due to O2 overpotential. |
| tp-ncert-chem-12-ch04-014 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-12/leep504.pdf p.5 | ii | Key page k0-14 reads 14.(ii) doubled (read correctly), but rate constant depends only on temperature, so it stays the same (option i). Transcription verified against p-05. |
| tp-ncert-chem-12-ch13-027 | flagged | solver disagrees with unofficial key | sources/third-party/chemistry/ncert-exemplar-12/leep513.pdf p.6 | (iii) | Key (iii) read correctly and transcription matches p.6, but amide+LiAlH4 (and nitrile+LiAlH4, printed 'nitrite') also keeps carbon count, so the question is ambiguous; NCERT key says Gabriel (iii). |
| tp-ncert-math-12-ch13-058 | flagged | solver disagrees with unofficial key | sources/third-party/mathematics/ncert-exemplar-12/leep213.pdf p.22 | D | Transcription matches page; P(AnB)=0.1 so P(B/A)+P(A/B)=1/3+1/4=7/12, not among options; key D (7/2) is wrong (printed-key error), 5/12 is nearest but also not correct |

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
- **tp-ncert-chem-11-ch03**: Q12 is a comprehension with five sub-parts (a)-(e), transcribed as five entries all numbered 12 (page 3/4), so numbers are not unique. Key entry '12' has options [] and an extra 'parts' field: a=iii(2), b=iii(2), c=iii(2), d=i(0), e=ii(1). The downstream importer needs to handle this.
- **tp-ncert-chem-11-ch03**: Q7: options (ii) and (iv) are identical as printed (F < Cl < Br < I); kept as printed. Key says (iii).
- **tp-ncert-chem-11-ch07**: Q11 option D is printed as CH4COONa (typo in source for CH3COONa); transcribed as printed
- **tp-ncert-chem-12-ch09**: Q2: options (i) and (iv) are identical as printed in the source; key says (iii). Transcribed as printed.
