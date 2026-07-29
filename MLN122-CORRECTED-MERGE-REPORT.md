# MLN122 Corrected Merge Report

## Integration decision

The reconciled 1.1-final dataset was strictly parsed and promoted to src/data/subjects/mln122.json. Disabled records remain in raw JSON for traceability and are filtered from the playable canonical Subject; runtime IDs remain source-ID based. Academic answers were not changed beyond the supplied corrections, including the existing ID 45 baseline correction.

## Dataset summary

| Item | Result |
|---|---|
| Production SHA-256 | 982efeccb61a441e86b3dc53e73a952f0754f57cc5c10924dd9d103671a0bc6a |
| Stored records | 478 |
| Active canonical questions | 475 |
| Disabled records | 3 |
| Schema version | 1.1-final |
| Runtime content version | 2 |
| Answer-change metadata | 22, including ID 45 |

## Requested ten categories

Categories overlap. Typography-only changes remain included in question/options changes because the supplied diffs do not provide a reliable semantic typography boundary.

| Category | Count | IDs |
|---|---:|---|
| answer_changed | 22 | 23, 45, 65, 215, 254, 256, 269, 310, 317, 321, 335, 352, 370, 386, 390, 393, 426, 427, 432, 449, 450, 466 |
| question_text_changed | 31 | 8, 33, 60, 83, 84, 87, 88, 109, 114, 143, 153, 170, 176, 215, 221, 256, 262, 354, 372, 386, 388, 389, 391, 399, 402, 437, 438, 439, 441, 466, 470 |
| options_changed | 46 | 8, 9, 10, 13, 16, 17, 45, 47, 69, 80, 81, 85, 87, 103, 122, 139, 152, 153, 215, 221, 228, 232, 235, 244, 250, 256, 262, 280, 310, 339, 386, 391, 394, 407, 409, 419, 420, 427, 432, 435, 437, 438, 443, 449, 459, 477 |
| explanation_changed | 478 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478 |
| metadata_only_changed | 0 | None |
| disabled_or_null_changed | 3 | 23, 254, 269 |
| record_reordered | 0 | None |
| question_identity_changed | 30 | 8, 33, 60, 83, 84, 87, 88, 109, 143, 153, 170, 176, 215, 221, 256, 262, 354, 372, 386, 388, 389, 391, 399, 402, 437, 438, 439, 441, 466, 470 |
| duplicate_equivalent_options | 1 | 160 |
| unrelated_suspicious_change | 0 | None |

## Per-question reconciliation (478 rows)

| ID | Original answer | Corrected answer | Question/options changed | Disabled | Explanation/source status | Resolution |
|---:|:---:|:---:|---|:---:|---|---|
| 1 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 2 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 3 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 4 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 5 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 6 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 7 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 8 | D | D | question + options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 9 | D | D | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 10 | B | B | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 11 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 12 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 13 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 14 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 15 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 16 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 17 | A | A | options | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 18 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 19 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 20 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 21 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 22 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 23 | B | null | no | yes | unsupported_do_not_use; GIÁO TRÌNH FULL.pdf | excluded; traceability retained |
| 24 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 25 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 26 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 27 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 28 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 29 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 30 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 31 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 32 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 33 | A | A | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 34 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 35 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 36 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 37 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 38 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 39 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 40 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 41 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 42 | E | E | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 43 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 44 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 45 | C | B | options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 46 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 47 | D | D | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 48 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 49 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 50 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 51 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 52 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 53 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 54 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 55 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 56 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 57 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 58 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 59 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 60 | A | A | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 61 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 62 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 63 | D | D | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 64 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 65 | D | A | no | no | corrected; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 66 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 67 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 68 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 69 | E | E | options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 70 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 71 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 72 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 73 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 74 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 75 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 76 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 77 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 78 | D | D | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 79 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 80 | C | C | options | no | corrected; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 81 | A | A | options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 82 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 83 | C | C | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 84 | A | A | question | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 85 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 86 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 87 | A | A | question + options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 88 | D | D | question | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 89 | E | E | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 90 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 91 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 92 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 93 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 94 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 95 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 96 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 97 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 98 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 99 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 100 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 101 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 102 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 103 | A | A | options | no | corrected; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 104 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 105 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 106 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 107 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 108 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 109 | A | A | question | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 110 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 111 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 112 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 113 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 114 | C | C | question | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 115 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 116 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 117 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 118 | D | D | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 119 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 120 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 121 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 122 | C | C | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 123 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 124 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 125 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 126 | F | F | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 127 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 128 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 129 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 130 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 131 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 132 | D | D | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 133 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 134 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 135 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 136 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 137 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 138 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 139 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 140 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 141 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 142 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 143 | A | A | question | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 144 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 145 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 146 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 147 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 148 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 149 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 150 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 151 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 152 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 153 | A | A | question + options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 154 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 155 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 156 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 157 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 158 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 159 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 160 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 161 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 162 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 163 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 164 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 165 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 166 | E | E | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 167 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 168 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 169 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 170 | B | B | question | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 171 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 172 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 173 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 174 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 175 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 176 | C | C | question | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 177 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 178 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 179 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 180 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 181 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 182 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 183 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 184 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 185 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 186 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 187 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 188 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 189 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 190 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 191 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 192 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 193 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 194 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 195 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 196 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 197 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 198 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 199 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 200 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 201 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 202 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 203 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 204 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 205 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 206 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 207 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 208 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 209 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 210 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 211 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 212 | E | E | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 213 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 214 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 215 | C | E | question + options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 216 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 217 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 218 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 219 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 220 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 221 | E | E | question + options | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 222 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 223 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 224 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 225 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 226 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 227 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 228 | D | D | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 229 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 230 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 231 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 232 | D | D | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 233 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 234 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 235 | D | D | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 236 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 237 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 238 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 239 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 240 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 241 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 242 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 243 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 244 | D | D | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 245 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 246 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 247 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 248 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 249 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 250 | D | D | options | no | corrected; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 251 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 252 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 253 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 254 | B | null | no | yes | unsupported_do_not_use; GIÁO TRÌNH FULL.pdf | excluded; traceability retained |
| 255 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 256 | D | C | question + options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 257 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 258 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 259 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 260 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 261 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 262 | C | C | question + options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 263 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 264 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 265 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 266 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 267 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 268 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 269 | B | null | no | yes | unsupported_do_not_use; GIÁO TRÌNH FULL.pdf | excluded; traceability retained |
| 270 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 271 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 272 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 273 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 274 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 275 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 276 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 277 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 278 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 279 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 280 | D | D | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 281 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 282 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 283 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 284 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 285 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 286 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 287 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 288 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 289 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 290 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 291 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 292 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 293 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 294 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 295 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 296 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 297 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 298 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 299 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 300 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 301 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 302 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 303 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 304 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 305 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 306 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 307 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 308 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 309 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 310 | B | D | options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 311 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 312 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 313 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 314 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 315 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 316 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 317 | D | C | no | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 318 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 319 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 320 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 321 | C | B | no | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 322 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 323 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 324 | D | D | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 325 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 326 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 327 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 328 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 329 | D | D | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 330 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 331 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 332 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 333 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 334 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 335 | B | A | no | no | corrected; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 336 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 337 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 338 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 339 | B | B | options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 340 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 341 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 342 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 343 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 344 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 345 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 346 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 347 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 348 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 349 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 350 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 351 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 352 | C | B | no | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 353 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 354 | A | A | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 355 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 356 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 357 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 358 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 359 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 360 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 361 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 362 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 363 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 364 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 365 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 366 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 367 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 368 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 369 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 370 | C | B | no | no | corrected; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 371 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 372 | E | E | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 373 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 374 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 375 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 376 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 377 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 378 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 379 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 380 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 381 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 382 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 383 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 384 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 385 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 386 | B | E | question + options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 387 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 388 | B | B | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 389 | A | A | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 390 | C | A | no | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 391 | C | C | question + options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 392 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 393 | B | A | no | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 394 | B | B | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 395 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 396 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 397 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 398 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 399 | A | A | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 400 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 401 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 402 | A | A | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 403 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 404 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 405 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 406 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 407 | E | E | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 408 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 409 | B | B | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 410 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 411 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 412 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 413 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 414 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 415 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 416 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 417 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 418 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 419 | E | E | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 420 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 421 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 422 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 423 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 424 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 425 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 426 | A | C | no | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 427 | C | B | options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 428 | B | B | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 429 | A | A | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 430 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 431 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 432 | A | B | options | no | corrected; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 433 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 434 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 435 | B | B | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 436 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 437 | E | E | question + options | no | corrected; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 438 | B | B | question + options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 439 | B | B | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 440 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 441 | A | A | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 442 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 443 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 444 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 445 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 446 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 447 | C | C | no | no | accepted_by_full_review_report; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 448 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 449 | A | E | options | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 450 | C | A | no | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 451 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 452 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 453 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 454 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 455 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 456 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 457 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 458 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 459 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 460 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 461 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 462 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 463 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 464 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 465 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 466 | D | A | question | no | corrected_against_review; GIÁO TRÌNH FULL.pdf | corrected answer retained |
| 467 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 468 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 469 | C | C | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 470 | C | C | question | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 471 | A | A | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 472 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 473 | E | E | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 474 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 475 | D | D | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 476 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |
| 477 | A | A | options | no | verified; GIÁO TRÌNH FULL.pdf | corrected content retained |
| 478 | B | B | no | no | verified; GIÁO TRÌNH FULL.pdf | metadata/explanation integrated |

## Consistency resolutions

All 478 per-ID rows are retained because explanation/source metadata changed for every record. The manifest contains 478 stored records, 475 active canonical questions, and disabled unresolved IDs 23, 254, and 269. Their raw records retain review reasons and legacy answers while `correctAnswer` is null; they are not playable. ID 160 retains its pre-existing duplicate-equivalent options and remains active because no supplied basis supports altering or disabling it. Answer, question-text, and options manifests are internally unique, in range, and count-consistent; baseline-diff truth is documented by this report and covered by tests.

The production loader continues to import `mln122.json`. Final records require audit metadata and consistent disabled/null semantics; legacy 1.0 input remains compatible. Canonical active questions preserve optional source pages/basis and audit metadata without introducing nullable canonical answers. Submission normalization removes unavailable question IDs and their option orders/responses before results rendering. No temporary corrected artifact remains in the data directory.

## Validation commands

- `npm run check`: PASS — lint, typecheck, data validation, 129 tests across 12 files, and production Next build.
- `npm run test:e2e`: PASS — 17 tests.
