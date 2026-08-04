'use client';
import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultExercises } from '@/lib/db';
import { ArrowLeft, Crown, Target, X, Loader2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const SVG_HITBOXES_MALE: Record<string, string> = {
  Chest: "M 135,148 L 148,148 L 158,150 L 168,151 L 172,156 L 173,163 L 175,171 L 176,178 L 175,189 L 173,196 L 167,199 L 158,202 L 148,204 L 135,202 L 127,199 L 120,194 L 117,189 L 114,184 L 111,179 L 109,178 L 104,181 L 109,174 L 114,165 L 120,158 L 125,153 Z M 185,152 L 191,149 L 198,147 L 203,147 L 208,147 L 218,147 L 221,147 L 228,152 L 238,159 L 243,169 L 247,175 L 251,179 L 244,177 L 241,183 L 238,190 L 233,195 L 228,200 L 221,202 L 215,203 L 206,203 L 200,203 L 193,202 L 187,198 L 182,193 L 180,185 L 180,177 L 180,169 L 183,160 Z", 
  Core: "M 231,271 L 231,276 L 224,281 L 218,286 L 211,286 L 208,281 L 210,272 L 210,264 L 211,261 L 215,261 L 211,258 L 211,253 L 211,246 L 215,244 L 221,241 L 226,235 L 229,230 L 233,225 L 231,233 L 229,241 L 229,248 L 231,258 L 233,264 Z M 233,225 L 224,223 L 216,228 L 211,236 L 211,240 L 215,243 L 221,241 L 226,236 L 231,228 Z M 233,215 L 228,221 L 221,225 L 215,230 L 210,226 L 211,220 L 213,216 L 218,215 L 223,213 L 228,215 Z M 231,207 L 224,213 L 218,215 L 213,216 L 210,215 L 211,208 L 215,205 L 219,205 L 223,207 L 226,208 L 229,208 Z M 140,259 L 144,261 L 145,266 L 147,274 L 147,282 L 145,286 L 140,286 L 134,284 L 129,279 L 124,274 L 124,268 L 124,261 L 127,254 L 127,243 L 126,235 L 122,225 L 127,233 L 134,240 L 140,244 L 144,248 L 145,253 L 145,256 L 144,259 Z M 122,225 L 131,223 L 137,228 L 142,230 L 145,235 L 145,241 L 142,243 L 139,243 L 132,240 L 127,233 Z M 126,216 L 132,213 L 137,215 L 142,216 L 145,220 L 145,225 L 142,230 L 137,228 L 132,225 L 126,218 L 122,215 L 126,216 Z M 126,208 L 132,213 L 139,215 L 144,216 L 145,211 L 144,207 L 140,205 L 137,205 L 132,207 L 129,208 Z M 178,327 L 185,325 L 190,319 L 193,309 L 198,294 L 201,281 L 205,269 L 205,261 L 198,263 L 191,263 L 185,263 L 183,263 L 178,268 L 178,281 L 178,325 L 177,268 L 172,263 L 167,263 L 159,263 L 152,261 L 152,268 L 154,279 L 157,292 L 162,307 L 167,319 L 170,325 Z M 205,243 L 206,249 L 205,258 L 198,259 L 190,259 L 185,259 L 182,258 L 180,253 L 178,246 L 180,241 L 185,240 L 193,241 Z M 149,243 L 155,241 L 162,241 L 170,241 L 173,241 L 175,243 L 177,253 L 175,258 L 170,259 L 163,259 L 155,258 L 152,258 L 150,253 L 149,248 Z M 182,238 L 190,238 L 200,240 L 205,240 L 206,235 L 206,228 L 201,225 L 193,221 L 185,220 L 182,220 L 180,223 L 180,231 L 180,235 Z M 173,220 L 168,220 L 162,221 L 155,225 L 149,228 L 149,233 L 150,238 L 155,240 L 162,238 L 168,238 L 173,238 L 177,235 L 177,228 L 175,221 Z M 175,202 L 172,200 L 165,202 L 155,205 L 150,208 L 149,215 L 149,221 L 150,223 L 154,223 L 159,220 L 165,218 L 172,216 L 175,215 L 177,208 Z M 182,202 L 191,202 L 200,205 L 205,210 L 206,216 L 206,223 L 203,223 L 196,220 L 190,218 L 183,216 L 180,215 L 180,208 L 180,203 Z",
  Back: "M 472,306 L 477,299 L 480,293 L 483,287 L 486,286 L 490,281 L 494,278 L 500,275 L 507,274 L 511,265 L 517,255 L 523,242 L 526,229 L 530,219 L 534,211 L 536,193 L 538,182 L 540,176 L 542,171 L 535,169 L 525,165 L 515,160 L 511,157 L 514,155 L 521,151 L 527,147 L 533,142 L 534,141 L 529,141 L 523,138 L 515,135 L 510,132 L 504,130 L 499,127 L 492,122 L 488,115 L 485,108 L 481,97 L 476,96 L 474,105 L 476,119 L 479,130 L 482,138 L 480,144 L 475,151 L 473,157 L 472,238 L 471,238 L 470,157 L 469,151 L 464,144 L 462,136 L 465,128 L 467,118 L 468,106 L 467,96 L 461,97 L 460,104 L 458,111 L 454,119 L 449,124 L 441,129 L 429,134 L 421,138 L 415,141 L 410,142 L 415,146 L 422,151 L 429,154 L 433,157 L 428,160 L 421,164 L 413,167 L 405,170 L 402,171 L 404,177 L 407,188 L 408,198 L 410,210 L 414,220 L 417,229 L 420,238 L 421,245 L 425,252 L 430,260 L 434,267 L 437,274 L 443,276 L 449,278 L 454,281 L 459,286 L 462,291 L 464,296 Z",
  Shoulder: "M 88,195 L 93,188 L 99,183 L 104,180 L 111,172 L 116,164 L 121,157 L 129,151 L 135,147 L 122,142 L 112,141 L 102,144 L 94,149 L 89,154 L 86,159 L 83,169 L 83,177 L 83,183 L 84,188 Z M 221,147 L 228,144 L 236,141 L 244,141 L 251,142 L 257,146 L 266,154 L 269,160 L 272,169 L 274,175 L 272,183 L 271,192 L 269,195 L 269,197 L 266,190 L 262,187 L 257,183 L 252,180 L 249,179 L 247,175 L 243,169 L 239,162 L 236,157 L 229,152 Z M 409,141 L 401,142 L 394,146 L 386,151 L 381,159 L 378,165 L 376,172 L 376,182 L 376,188 L 376,190 L 386,179 L 396,172 L 407,169 L 416,165 L 425,162 L 432,157 L 425,152 L 421,149 L 416,146 Z M 513,155 L 523,151 L 529,146 L 534,141 L 541,142 L 551,146 L 557,151 L 562,157 L 567,167 L 567,175 L 567,182 L 566,187 L 561,180 L 551,174 L 541,170 L 531,167 L 521,164 L 511,157 Z",
  Bicep: "M 241,176 L 245,178 L 252,182 L 258,186 L 263,191 L 265,195 L 269,185 L 271,188 L 274,193 L 275,199 L 277,206 L 277,214 L 277,218 L 275,223 L 271,231 L 269,237 L 267,241 L 266,246 L 266,251 L 262,248 L 258,244 L 256,243 L 254,248 L 252,252 L 251,245 L 251,238 L 249,233 L 246,227 L 243,220 L 241,213 L 238,207 L 238,198 L 237,193 L 236,185 L 235,182 Z M 101,251 L 98,246 L 95,243 L 91,247 L 87,251 L 86,245 L 84,238 L 82,231 L 79,226 L 76,221 L 75,218 L 75,211 L 76,204 L 78,198 L 80,192 L 83,185 L 86,190 L 87,195 L 92,188 L 98,183 L 105,179 L 111,176 L 115,180 L 117,183 L 116,189 L 115,196 L 114,204 L 114,208 L 112,214 L 110,220 L 107,225 L 104,231 L 102,235 L 101,241 L 101,246 Z",
  Tricep: "M 365,237 L 367,240 L 370,243 L 374,246 L 378,248 L 382,249 L 383,246 L 384,244 L 386,242 L 388,241 L 392,239 L 394,237 L 397,234 L 400,227 L 403,222 L 405,216 L 407,211 L 407,206 L 407,202 L 406,197 L 405,192 L 405,187 L 404,182 L 403,177 L 401,174 L 399,171 L 396,172 L 391,174 L 386,177 L 382,180 L 378,184 L 375,187 L 373,193 L 371,200 L 369,208 L 368,216 L 368,221 L 367,225 L 367,230 L 366,233 Z M 541,171 L 546,173 L 553,177 L 560,181 L 564,187 L 568,195 L 570,203 L 571,209 L 572,216 L 572,221 L 573,224 L 574,226 L 574,234 L 575,238 L 574,240 L 570,243 L 566,246 L 562,248 L 557,249 L 556,245 L 556,243 L 552,241 L 547,239 L 544,235 L 541,229 L 539,224 L 536,219 L 534,213 L 533,208 L 532,206 L 533,199 L 534,194 L 534,189 L 535,185 L 537,178 Z",
  Forearms: "M 277,216 L 276,222 L 273,227 L 271,232 L 267,240 L 266,249 L 267,252 L 263,248 L 259,245 L 257,242 L 254,247 L 252,251 L 253,257 L 255,265 L 259,270 L 262,275 L 267,280 L 271,285 L 275,291 L 279,298 L 281,303 L 282,308 L 284,307 L 288,306 L 292,306 L 296,307 L 300,310 L 301,306 L 300,301 L 298,295 L 296,287 L 295,279 L 294,272 L 293,263 L 292,257 L 291,251 L 290,246 L 287,241 L 285,236 L 282,230 L 279,224 Z M 75,217 L 77,224 L 80,230 L 83,235 L 85,241 L 86,248 L 86,252 L 89,248 L 93,245 L 95,243 L 97,246 L 101,251 L 100,257 L 98,263 L 95,268 L 91,273 L 87,278 L 82,285 L 78,291 L 75,297 L 71,304 L 70,308 L 67,306 L 63,305 L 60,305 L 56,306 L 52,308 L 51,309 L 52,304 L 53,298 L 55,292 L 56,287 L 57,283 L 58,275 L 58,270 L 59,263 L 60,256 L 62,248 L 64,242 L 67,236 L 70,231 L 72,227 L 73,222 Z M 366,225 L 366,232 L 365,237 L 368,241 L 372,244 L 377,248 L 381,249 L 383,247 L 384,243 L 389,241 L 393,237 L 396,234 L 395,242 L 394,250 L 392,259 L 388,267 L 384,274 L 378,282 L 372,290 L 367,298 L 365,306 L 365,309 L 362,307 L 358,306 L 354,305 L 349,306 L 345,308 L 346,302 L 348,295 L 349,287 L 350,279 L 351,273 L 352,265 L 353,257 L 354,251 L 358,241 L 362,233 Z M 574,227 L 578,234 L 582,241 L 585,250 L 587,260 L 588,272 L 589,282 L 591,295 L 594,302 L 595,310 L 592,307 L 588,305 L 584,305 L 579,306 L 576,307 L 573,300 L 570,294 L 566,289 L 562,282 L 557,277 L 553,271 L 549,263 L 546,254 L 545,245 L 543,234 L 548,239 L 551,241 L 556,243 L 557,247 L 558,248 L 561,248 L 564,247 L 567,245 L 570,243 L 573,240 L 575,238 L 574,234 L 573,231 Z",
  Legs: "M 231,278 L 226,285 L 218,291 L 211,298 L 204,305 L 199,312 L 192,322 L 187,329 L 182,333 L 180,336 L 180,342 L 179,363 L 180,375 L 181,384 L 182,395 L 181,405 L 181,424 L 183,436 L 187,451 L 188,457 L 186,466 L 183,479 L 182,490 L 183,501 L 187,520 L 188,539 L 189,547 L 188,553 L 184,558 L 188,556 L 193,555 L 197,555 L 202,556 L 207,558 L 208,552 L 210,542 L 213,533 L 217,521 L 222,507 L 225,495 L 227,481 L 226,470 L 225,462 L 223,454 L 222,448 L 223,439 L 225,420 L 232,406 L 237,393 L 241,379 L 243,366 L 245,356 L 245,334 L 242,320 L 238,305 L 236,291 Z M 121,280 L 125,282 L 129,286 L 134,290 L 139,295 L 147,305 L 154,313 L 160,321 L 165,327 L 170,332 L 172,334 L 172,337 L 173,344 L 173,363 L 172,376 L 170,387 L 170,399 L 171,410 L 171,428 L 169,439 L 166,454 L 166,460 L 168,471 L 171,482 L 171,493 L 169,505 L 166,520 L 165,537 L 164,547 L 165,553 L 168,559 L 165,558 L 161,556 L 156,556 L 152,556 L 148,558 L 144,560 L 145,554 L 143,545 L 139,531 L 136,521 L 131,507 L 128,497 L 126,488 L 125,479 L 126,471 L 129,458 L 130,445 L 129,433 L 126,420 L 122,411 L 115,394 L 111,378 L 106,352 L 107,338 L 108,328 L 112,315 L 115,302 L 117,289 Z M 467,296 L 470,298 L 473,296 L 478,285 L 485,278 L 494,272 L 503,269 L 513,271 L 521,276 L 526,281 L 531,293 L 533,305 L 537,318 L 540,334 L 540,348 L 538,360 L 537,373 L 534,384 L 529,399 L 523,413 L 518,425 L 517,435 L 516,449 L 517,459 L 520,474 L 521,485 L 518,502 L 513,517 L 508,531 L 504,545 L 501,556 L 502,565 L 503,569 L 501,574 L 498,579 L 494,581 L 486,580 L 481,579 L 479,574 L 478,565 L 480,560 L 482,553 L 482,545 L 481,532 L 480,520 L 477,508 L 475,499 L 476,485 L 480,470 L 482,459 L 481,451 L 478,440 L 476,429 L 476,410 L 477,396 L 474,375 L 473,360 L 474,348 L 475,341 L 476,338 L 472,334 L 470,331 L 468,334 L 465,338 L 466,344 L 467,354 L 467,369 L 465,380 L 464,391 L 463,400 L 463,410 L 464,417 L 464,434 L 461,444 L 459,452 L 458,457 L 458,465 L 461,472 L 464,484 L 465,495 L 464,503 L 461,513 L 458,539 L 458,551 L 459,558 L 462,563 L 462,571 L 461,576 L 457,578 L 452,579 L 446,579 L 441,577 L 438,574 L 437,568 L 439,562 L 439,555 L 436,547 L 433,534 L 428,521 L 423,507 L 421,498 L 419,487 L 419,475 L 422,461 L 424,451 L 423,439 L 422,424 L 419,417 L 414,409 L 411,398 L 404,377 L 401,358 L 400,344 L 401,327 L 405,311 L 408,299 L 410,289 L 415,278 L 424,272 L 433,270 L 442,271 L 450,274 L 457,279 L 463,286 Z"
};

const SVG_HITBOXES_FEMALE: Record<string, string> = {
  Chest: "M 221,148 L 214,147 L 205,148 L 195,149 L 187,151 L 182,154 L 182,158 L 185,161 L 184,165 L 181,171 L 179,180 L 179,188 L 182,196 L 188,203 L 193,206 L 202,210 L 214,211 L 223,209 L 230,205 L 235,198 L 237,189 L 235,183 L 239,179 L 241,176 L 247,179 L 240,171 L 236,163 L 231,156 L 226,152 Z M 116,184 L 116,193 L 118,199 L 122,204 L 127,208 L 132,210 L 141,211 L 150,210 L 158,207 L 166,202 L 171,194 L 174,186 L 173,177 L 171,170 L 168,165 L 167,161 L 170,158 L 170,155 L 167,153 L 162,150 L 151,148 L 142,147 L 134,148 L 129,150 L 123,155 L 118,161 L 113,169 L 109,174 L 105,179 L 111,177 L 112,176 L 115,180 Z", 
  Core: "M 123,206 L 122,210 L 123,213 L 126,215 L 129,216 L 133,215 L 135,214 L 133,211 L 131,210 L 127,208 L 125,207 Z M 123,213 L 122,217 L 123,221 L 126,223 L 129,224 L 132,224 L 130,221 L 129,218 L 129,216 Z M 135,214 L 139,217 L 144,220 L 143,227 L 142,229 L 138,229 L 134,227 L 131,223 L 129,216 Z M 127,224 L 127,229 L 129,234 L 133,238 L 137,242 L 140,244 L 143,243 L 144,239 L 144,235 L 144,234 L 141,231 L 138,229 L 135,227 L 132,223 Z M 138,244 L 142,249 L 144,254 L 144,258 L 141,261 L 138,258 L 142,264 L 144,272 L 145,279 L 144,284 L 141,286 L 138,285 L 133,283 L 129,280 L 126,276 L 123,274 L 124,267 L 126,261 L 128,256 L 130,250 L 129,244 L 128,237 L 127,233 L 128,232 Z M 230,204 L 230,209 L 230,212 L 229,213 L 230,217 L 229,221 L 228,223 L 226,224 L 225,228 L 223,234 L 219,239 L 214,243 L 211,244 L 209,241 L 209,238 L 209,234 L 213,230 L 215,229 L 212,229 L 210,228 L 209,225 L 209,222 L 209,219 L 214,216 L 217,214 L 220,212 L 222,209 Z M 225,231 L 226,232 L 225,235 L 224,237 L 223,240 L 223,244 L 223,246 L 223,251 L 225,257 L 227,261 L 228,265 L 229,269 L 228,273 L 225,277 L 222,280 L 219,283 L 214,285 L 210,285 L 208,284 L 207,279 L 208,274 L 210,268 L 211,263 L 215,259 L 211,260 L 209,258 L 209,255 L 210,251 L 211,247 L 214,243 L 219,240 Z M 152,209 L 157,207 L 162,204 L 167,202 L 171,202 L 173,204 L 174,207 L 174,210 L 174,213 L 172,215 L 167,217 L 165,218 L 159,220 L 158,221 L 153,222 L 151,223 L 148,222 L 147,220 L 147,216 L 149,213 Z M 182,202 L 186,203 L 190,204 L 193,207 L 197,208 L 202,209 L 203,212 L 204,215 L 205,217 L 205,220 L 204,221 L 202,222 L 201,223 L 198,222 L 197,222 L 189,219 L 183,216 L 179,214 L 178,212 L 178,208 L 179,205 Z M 148,230 L 151,227 L 156,224 L 161,222 L 168,220 L 173,220 L 174,225 L 174,230 L 174,235 L 174,239 L 172,240 L 168,240 L 162,240 L 158,240 L 154,241 L 151,241 L 149,240 L 148,237 L 148,233 Z M 181,220 L 190,222 L 198,225 L 203,229 L 205,235 L 204,239 L 201,242 L 195,241 L 189,240 L 181,240 L 178,237 L 177,230 L 178,223 Z M 150,244 L 154,245 L 159,244 L 163,243 L 169,243 L 173,245 L 174,250 L 174,254 L 174,259 L 172,262 L 168,263 L 163,263 L 157,262 L 152,260 L 149,256 L 148,246 Z M 179,244 L 184,243 L 190,244 L 196,245 L 203,244 L 204,248 L 203,254 L 202,259 L 199,260 L 189,262 L 180,262 L 178,259 L 178,251 Z M 151,263 L 158,265 L 163,265 L 168,266 L 172,267 L 174,270 L 176,305 L 178,270 L 181,267 L 185,265 L 190,265 L 195,264 L 200,263 L 202,266 L 202,275 L 199,285 L 194,298 L 190,309 L 188,314 L 183,317 L 176,319 L 170,318 L 164,314 L 158,297 L 153,283 L 151,275 L 150,268 Z",
  Back: "M 458,102 L 461,101 L 463,100 L 466,102 L 467,105 L 467,109 L 466,116 L 465,122 L 464,128 L 462,132 L 460,136 L 460,140 L 462,143 L 464,147 L 467,151 L 468,156 L 469,238 L 470,238 L 471,156 L 473,150 L 476,145 L 479,141 L 480,137 L 479,133 L 476,128 L 474,122 L 473,113 L 472,107 L 473,103 L 474,101 L 477,100 L 480,101 L 481,105 L 482,110 L 485,115 L 488,120 L 492,123 L 496,127 L 501,129 L 508,132 L 514,135 L 521,138 L 524,140 L 530,141 L 528,144 L 524,147 L 519,150 L 512,153 L 509,156 L 513,160 L 520,164 L 527,167 L 534,169 L 541,171 L 538,174 L 536,179 L 535,186 L 534,191 L 533,197 L 531,203 L 531,208 L 528,215 L 522,227 L 520,234 L 517,240 L 514,247 L 509,255 L 505,261 L 504,266 L 503,269 L 496,270 L 490,274 L 486,277 L 480,282 L 476,287 L 473,293 L 472,297 L 469,297 L 467,295 L 466,291 L 464,286 L 460,282 L 455,277 L 453,276 L 450,274 L 447,272 L 443,270 L 438,269 L 436,268 L 436,265 L 434,261 L 432,256 L 429,252 L 427,248 L 424,244 L 422,240 L 419,234 L 417,228 L 415,222 L 412,217 L 410,210 L 408,204 L 406,196 L 405,189 L 404,182 L 403,176 L 401,173 L 400,171 L 407,169 L 414,166 L 421,163 L 426,160 L 431,156 L 428,154 L 423,151 L 418,149 L 413,145 L 410,141 L 416,139 L 422,137 L 429,134 L 435,131 L 443,128 L 449,124 L 453,119 L 456,114 L 458,108 Z",
  Shoulder: "M 87,195 L 90,190 L 94,186 L 98,183 L 102,181 L 105,179 L 108,176 L 111,173 L 113,169 L 116,163 L 120,158 L 123,154 L 127,151 L 130,149 L 131,147 L 130,144 L 127,143 L 123,141 L 120,141 L 114,140 L 108,141 L 105,142 L 102,142 L 96,146 L 92,149 L 89,152 L 85,157 L 83,164 L 82,169 L 82,175 L 83,181 L 83,186 L 85,190 Z M 221,148 L 222,145 L 225,144 L 228,143 L 232,141 L 236,141 L 240,141 L 244,141 L 247,142 L 251,144 L 255,145 L 258,147 L 261,150 L 264,153 L 267,157 L 268,160 L 269,165 L 271,169 L 271,174 L 270,179 L 269,183 L 268,188 L 265,195 L 263,191 L 261,188 L 258,186 L 255,184 L 252,182 L 249,180 L 246,177 L 245,175 L 243,174 L 241,172 L 240,170 L 239,168 L 237,164 L 234,160 L 232,157 L 228,153 Z M 378,185 L 380,182 L 383,179 L 388,175 L 393,173 L 398,172 L 404,170 L 410,167 L 416,165 L 421,163 L 426,160 L 430,157 L 431,155 L 429,154 L 426,152 L 423,151 L 419,149 L 416,147 L 412,145 L 410,141 L 407,141 L 404,142 L 401,142 L 398,142 L 395,143 L 392,145 L 388,147 L 385,148 L 383,150 L 381,154 L 379,158 L 378,163 L 376,167 L 375,171 L 375,176 L 376,180 L 377,183 Z M 562,184 L 564,181 L 564,176 L 564,172 L 564,167 L 563,162 L 561,158 L 559,155 L 556,151 L 553,147 L 549,145 L 545,144 L 541,143 L 537,142 L 533,141 L 531,141 L 529,143 L 527,145 L 524,147 L 521,149 L 518,150 L 515,152 L 512,154 L 509,156 L 511,158 L 513,160 L 516,161 L 519,162 L 522,164 L 528,166 L 533,168 L 539,170 L 545,172 L 549,174 L 554,177 L 558,180 Z",
  Bicep: "M 241,176 L 245,178 L 252,182 L 258,186 L 263,191 L 265,195 L 269,185 L 271,188 L 274,193 L 275,199 L 277,206 L 277,214 L 277,218 L 275,223 L 271,231 L 269,237 L 267,241 L 266,246 L 266,251 L 262,248 L 258,244 L 256,243 L 254,248 L 252,252 L 251,245 L 251,238 L 249,233 L 246,227 L 243,220 L 241,213 L 238,207 L 238,198 L 237,193 L 236,185 L 235,182 Z M 101,251 L 98,246 L 95,243 L 91,247 L 87,251 L 86,245 L 84,238 L 82,231 L 79,226 L 76,221 L 75,218 L 75,211 L 76,204 L 78,198 L 80,192 L 83,185 L 86,190 L 87,195 L 92,188 L 98,183 L 105,179 L 111,176 L 115,180 L 117,183 L 116,189 L 115,196 L 114,204 L 114,208 L 112,214 L 110,220 L 107,225 L 104,231 L 102,235 L 101,241 L 101,246 Z",
  Tricep: "M 365,237 L 367,240 L 370,243 L 374,246 L 378,248 L 382,249 L 383,246 L 384,244 L 386,242 L 388,241 L 392,239 L 394,237 L 397,234 L 400,227 L 403,222 L 405,216 L 407,211 L 407,206 L 407,202 L 406,197 L 405,192 L 405,187 L 404,182 L 403,177 L 401,174 L 399,171 L 396,172 L 391,174 L 386,177 L 382,180 L 378,184 L 375,187 L 373,193 L 371,200 L 369,208 L 368,216 L 368,221 L 367,225 L 367,230 L 366,233 Z M 541,171 L 546,173 L 553,177 L 560,181 L 564,187 L 568,195 L 570,203 L 571,209 L 572,216 L 572,221 L 573,224 L 574,226 L 574,234 L 575,238 L 574,240 L 570,243 L 566,246 L 562,248 L 557,249 L 556,245 L 556,243 L 552,241 L 547,239 L 544,235 L 541,229 L 539,224 L 536,219 L 534,213 L 533,208 L 532,206 L 533,199 L 534,194 L 534,189 L 535,185 L 537,178 Z",
  Forearms: "M 277,216 L 276,222 L 273,227 L 271,232 L 267,240 L 266,249 L 267,252 L 263,248 L 259,245 L 257,242 L 254,247 L 252,251 L 253,257 L 255,265 L 259,270 L 262,275 L 267,280 L 271,285 L 275,291 L 279,298 L 281,303 L 282,308 L 284,307 L 288,306 L 292,306 L 296,307 L 300,310 L 301,306 L 300,301 L 298,295 L 296,287 L 295,279 L 294,272 L 293,263 L 292,257 L 291,251 L 290,246 L 287,241 L 285,236 L 282,230 L 279,224 Z M 75,217 L 77,224 L 80,230 L 83,235 L 85,241 L 86,248 L 86,252 L 89,248 L 93,245 L 95,243 L 97,246 L 101,251 L 100,257 L 98,263 L 95,268 L 91,273 L 87,278 L 82,285 L 78,291 L 75,297 L 71,304 L 70,308 L 67,306 L 63,305 L 60,305 L 56,306 L 52,308 L 51,309 L 52,304 L 53,298 L 55,292 L 56,287 L 57,283 L 58,275 L 58,270 L 59,263 L 60,256 L 62,248 L 64,242 L 67,236 L 70,231 L 72,227 L 73,222 Z M 366,225 L 366,232 L 365,237 L 368,241 L 372,244 L 377,248 L 381,249 L 383,247 L 384,243 L 389,241 L 393,237 L 396,234 L 395,242 L 394,250 L 392,259 L 388,267 L 384,274 L 378,282 L 372,290 L 367,298 L 365,306 L 365,309 L 362,307 L 358,306 L 354,305 L 349,306 L 345,308 L 346,302 L 348,295 L 349,287 L 350,279 L 351,273 L 352,265 L 353,257 L 354,251 L 358,241 L 362,233 Z M 574,227 L 578,234 L 582,241 L 585,250 L 587,260 L 588,272 L 589,282 L 591,295 L 594,302 L 595,310 L 592,307 L 588,305 L 584,305 L 579,306 L 576,307 L 573,300 L 570,294 L 566,289 L 562,282 L 557,277 L 553,271 L 549,263 L 546,254 L 545,245 L 543,234 L 548,239 L 551,241 L 556,243 L 557,247 L 558,248 L 561,248 L 564,247 L 567,245 L 570,243 L 573,240 L 575,238 L 574,234 L 573,231 Z",
};

const RANKS = ["Wood", "Chalk", "Iron", "Steel", "Contender", "Gladiator", "Juggernaut", "Colossus", "Olympian"];
const TIERS = ["I", "II", "III"];

const RANK_THRESHOLDS = [0, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000, 350000, 500000, 750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 3500000, 4500000, 5000000, 6000000, 7000000, 8000000, 9000000];

const RANK_THEMES: Record<string, { hex: string, anim: string }> = {
  Wood: { hex: '#9c6a46', anim: 'animate-[idle-float_6s_ease-in-out_infinite]' },
  Chalk: { hex: '#e5e7eb', anim: 'animate-[idle-float_5s_ease-in-out_infinite]' },
  Iron: { hex: '#9ca3af', anim: 'animate-[idle-float_4s_ease-in-out_infinite]' },
  Steel: { hex: '#cbd5e1', anim: 'animate-[idle-float_3s_ease-in-out_infinite]' },
  Contender: { hex: '#ef4444', anim: 'animate-[idle-pulse_2s_ease-in-out_infinite]' },
  Gladiator: { hex: '#f97316', anim: 'animate-[idle-pulse_1.5s_ease-in-out_infinite]' },
  Juggernaut: { hex: '#a855f7', anim: 'animate-[idle-heavy_3s_ease-in-out_infinite]' },
  Colossus: { hex: '#6366f1', anim: 'animate-[idle-heavy_2s_ease-in-out_infinite]' },
  Olympian: { hex: '#facc15', anim: 'animate-[idle-shake_4s_ease-in-out_infinite]' },
  Titan: { hex: '#22d3ee', anim: 'animate-[idle-titan_3s_ease-in-out_infinite]' },
  God: { hex: '#fef08a', anim: 'animate-[idle-god_5s_ease-in-out_infinite]' },
};

function getAccountRank(points: number) {
  if (points >= 25000000) return { name: "God", tier: "", fullName: "God Rank", image: "god.png", current: 25000000, next: null, progress: 100, points };
  if (points >= 10000000) {
    let titanLevel = Math.floor((points - 10000000) / 150000) + 1;
    if (titanLevel > 100) titanLevel = 100;
    const currentThresh = 10000000 + ((titanLevel - 1) * 150000);
    const nextThresh = titanLevel === 100 ? 25000000 : 10000000 + (titanLevel * 150000);
    const progress = ((points - currentThresh) / (nextThresh - currentThresh)) * 100;
    const emblemNum = [100, 75, 50, 25, 10, 5, 3, 2, 1].find(e => titanLevel >= e) || 1;
    return { name: "Titan", tier: titanLevel.toString(), fullName: `Titan ${titanLevel}`, image: `titan${emblemNum}.png`, current: currentThresh, next: nextThresh, progress, points };
  }
  let currentTierIndex = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) { if (points >= RANK_THRESHOLDS[i]) currentTierIndex = i; }
  const currentThresh = RANK_THRESHOLDS[currentTierIndex];
  const nextThresh = currentTierIndex === RANK_THRESHOLDS.length - 1 ? 10000000 : RANK_THRESHOLDS[currentTierIndex + 1];
  const rankName = RANKS[Math.floor(currentTierIndex / 3)];
  const tierName = TIERS[currentTierIndex % 3];
  return { name: rankName, tier: tierName, fullName: `${rankName} ${tierName}`, image: `${rankName.toLowerCase()}${(currentTierIndex % 3) + 1}.png`, current: currentThresh, next: nextThresh, progress: ((points - currentThresh) / (nextThresh - currentThresh)) * 100, points };
}

export default function Progression() {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [gender, setGender] = useState('male');
  
  const [showCalibration, setShowCalibration] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [liftMonths, setLiftMonths] = useState(8);
  const [calibrationPts, setCalibrationPts] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const allSets = useLiveQuery(() => db.sets.toArray());

  useEffect(() => { 
    if (typeof window !== 'undefined') {
      setGender(localStorage.getItem('gym_gender') || 'male'); 
      setCalibrationPts(Number(localStorage.getItem('gym_calibration_pts') || 0));
      if (!localStorage.getItem('gym_calibrated')) {
        setShowCalibration(true);
      }
      setIsMounted(true);
    }
  }, []);

  if (!isMounted || allSets === undefined) {
    return <div className="h-full w-full flex items-center justify-center bg-transparent"><Loader2 className="animate-spin text-[hsl(var(--muted))]" size={32}/></div>;
  }

  const volumes: Record<string, number> = {};
  defaultExercises.categories.forEach(cat => volumes[cat] = 0);
  const exToCategory: Record<string, string> = {};
  Object.entries(defaultExercises.exercises).forEach(([cat, exes]) => exes.forEach(ex => exToCategory[ex.id] = cat));

  let totalPoints = calibrationPts;

  allSets.forEach(set => {
    if (set.isCompleted && exToCategory[set.exerciseId]) {
      volumes[exToCategory[set.exerciseId]] += (set.weight * set.reps);
      totalPoints += (set.weight * set.reps) * (1 + (set.weight / 150));
    }
  });

  const activePoints = totalPoints;
  const currentRank = getAccountRank(activePoints);
  const rankTheme = RANK_THEMES[currentRank.name] || RANK_THEMES['Wood'];
  const isGod = currentRank.name === 'God';

const completeCalibration = () => {
    localStorage.setItem('gym_username', userName);
    localStorage.setItem('gym_calibrated', 'true');
    const newCalibrationPts = liftMonths * 30000;
    localStorage.setItem('gym_calibration_pts', newCalibrationPts.toString());
    setCalibrationPts(newCalibrationPts);
    setShowCalibration(false);
    window.dispatchEvent(new Event('gym-calibrated'));
  };

  if (showCalibration) {
    return (
      <div className="fixed inset-0 z-[999] bg-[#09090b] flex flex-col items-center justify-center p-6 w-screen h-screen overflow-hidden">
        {onboardingStep === 1 && (
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000 w-full max-w-sm text-center">
            <Crown className="text-blue-500 mb-8 w-20 h-20 animate-pulse" />
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight leading-tight">Welcome to<br/>Gym Tracker</h1>
            <p className="text-blue-500/80 font-black uppercase tracking-[0.2em] text-xs mb-16">The place where you will track your gains</p>
            <button onClick={() => setOnboardingStep(2)} className="w-full bg-white text-black font-black py-5 rounded-full tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 text-sm">Continue</button>
          </div>
        )}
        {onboardingStep === 2 && (
          <div className="flex flex-col items-center justify-center animate-in slide-in-from-right-10 fade-in duration-700 w-full max-w-sm">
            <h2 className="text-3xl font-black text-white mb-2 text-center">Introduce yourself!</h2>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-10 text-center">What should we call you?</p>
            <input autoFocus type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your Name" className="w-full bg-white/5 border border-white/10 text-white text-3xl font-black p-6 rounded-3xl text-center focus:outline-none focus:border-blue-500 transition-colors mb-8 placeholder:text-white/20" />
            <button disabled={!userName.trim()} onClick={() => setOnboardingStep(3)} className="w-full bg-blue-600 disabled:opacity-50 disabled:bg-white/10 text-white font-black py-5 rounded-full tracking-widest uppercase transition-all active:scale-95 text-sm">Next</button>
          </div>
        )}
        {onboardingStep === 3 && (
          <div className="flex flex-col items-center justify-center animate-in slide-in-from-bottom-10 fade-in duration-1000 w-full max-w-sm text-center">
            <h2 className="text-4xl font-black text-white mb-4">Nice to meet you,<br/><span className="text-blue-500">{userName}</span>!</h2>
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-16">Okay {userName}, let's begin.</p>
            <button onClick={() => setOnboardingStep(4)} className="w-full bg-white text-black font-black py-5 rounded-full tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 text-sm">Ready</button>
          </div>
        )}
        {onboardingStep === 4 && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-700 w-full max-w-sm">
            <Calendar className="text-blue-500 mb-6" size={48} />
            <h2 className="text-3xl font-black text-white text-center mb-4 leading-tight">Your Experience</h2>
            <p className="text-white/50 text-center text-xs font-bold uppercase tracking-widest leading-relaxed mb-12">How many months have you been<br/>consistently lifting?</p>
            <div className="flex items-center gap-6 mb-12 w-full justify-center">
              <button onClick={() => setLiftMonths(Math.max(0, liftMonths - 1))} className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all border border-white/10 text-white font-black"><ChevronDown size={28} /></button>
              <div className="flex flex-col items-center w-28">
                <span className="text-6xl font-black text-white tracking-tighter">{liftMonths}</span>
                <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase mt-2">Months</span>
              </div>
              <button onClick={() => setLiftMonths(Math.min(120, liftMonths + 1))} className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all border border-white/10 text-white font-black"><ChevronUp size={28} /></button>
            </div>
            <button onClick={() => setOnboardingStep(5)} className="w-full bg-blue-600 text-white font-black py-5 rounded-full tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95 text-sm">Calibrate Rank</button>
          </div>
        )}
        {onboardingStep === 5 && (() => {
           const calcRank = getAccountRank(liftMonths * 30000);
           const tTheme = RANK_THEMES[calcRank.name] || RANK_THEMES['Wood'];
           return (
             <div className="flex flex-col items-center justify-center animate-in zoom-in-50 fade-in duration-[1500ms] w-full h-full relative" onAnimationEnd={(e) => { if(e.animationName.includes('zoom-in')) setTimeout(completeCalibration, 3500); }}>
                <div className="absolute inset-0 w-full h-full bg-black z-[-1]" />
                <div className="absolute w-[800px] h-[800px] opacity-40 blur-[100px] rounded-full animate-pulse transition-colors duration-1000 z-0" style={{ backgroundColor: tTheme.hex }} />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50 mb-8 z-10 animate-in slide-in-from-top-10 fade-in duration-1000 delay-500 fill-mode-both">Starting Rank Established</span>
                <img src={`/ranks/${calcRank.image}`} alt={calcRank.name} className="w-64 h-64 object-contain z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] animate-[idle-float_4s_ease-in-out_infinite]" />
                <h1 className="text-6xl font-black uppercase tracking-tighter mt-8 z-10 text-center animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-1000 fill-mode-both" style={{ color: tTheme.hex, textShadow: `0 0 30px ${tTheme.hex}80` }}>{calcRank.name}</h1>
                <span className="text-sm font-bold text-white/80 tracking-[0.3em] uppercase mt-4 z-10 animate-in fade-in duration-1000 delay-1500 fill-mode-both">{calcRank.tier || `LEVEL ${calcRank.tier}`}</span>
             </div>
           );
        })()}
      </div>
    );
  }

  const getMuscleDetails = (xp: number) => {
    const level = Math.floor(Math.sqrt(xp / 500)) + 1;
    const currentXP = Math.pow(level - 1, 2) * 500;
    const nextXP = Math.pow(level, 2) * 500;
    const progress = xp === 0 ? 0 : ((xp - currentXP) / (nextXP - currentXP)) * 100;
    let hex = "#9ca3af";
    if (level >= 10) hex = "#22c55e"; if (level >= 20) hex = "#3b82f6"; if (level >= 30) hex = "#a855f7";
    if (level >= 50) hex = "#eab308"; if (level >= 75) hex = "#ef4444"; if (level >= 100) hex = "#22d3ee";
    return { level, progress, currentXP, nextXP, hex };
  };

  const AnatomyModel = ({ highlight }: { highlight?: string | null }) => {
    const activeHitboxes = gender === 'female' ? SVG_HITBOXES_FEMALE : SVG_HITBOXES_MALE;
    const baseImage = `/anatomy/${gender === 'female' ? 'base2' : 'base'}.png`;

    return (
      <div className="relative w-full aspect-[4/5] max-w-[400px] mx-auto flex items-center justify-center">
        <img 
          src={baseImage} 
          alt="Anatomy Base"
          loading="eager"
          decoding="async"
          draggable="false"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />
        <div 
          className="absolute inset-0 w-full h-full z-20"
          style={{
            WebkitMaskImage: `url(${baseImage})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: `url(${baseImage})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center'
          }}
        >
          <svg viewBox="0 0 640 640" preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
            {Object.entries(activeHitboxes).map(([id, path]) => {
              if (!path) return null;
              const xp = volumes[id] || 0;
              const { hex } = getMuscleDetails(xp);
              const isFocused = highlight === id;
              const isDimmed = highlight && !isFocused;
              
              return (
                <path
                  key={`group-${id}`}
                  d={path}
                  onClick={() => { if (!highlight) setSelectedMuscle(id) }}
                  style={{ fill: isFocused ? '#ef4444' : (xp > 0 ? hex : 'transparent') }}
                  className={`transition-all duration-500 outline-none
                    ${isFocused ? 'opacity-70 mix-blend-screen pointer-events-none' : ''}
                    ${isDimmed ? 'opacity-0 pointer-events-none' : ''}
                    ${!highlight && xp > 0 ? 'opacity-0 cursor-pointer mix-blend-screen hover:!opacity-60 hover:filter hover:drop-shadow-[0_0_15px_currentColor]' : ''}
                    ${!highlight && xp === 0 ? 'opacity-0 cursor-pointer hover:!opacity-30 hover:!fill-white mix-blend-overlay' : ''}
                  `}
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-transparent text-white overflow-x-hidden font-sans flex flex-col items-center relative w-full h-full pb-32">
      
      {/* Global Fixed Glow explicitly engineered to sweep across the full screen seamlessly */}
      <div className="fixed inset-0 pointer-events-none z-[-1] flex items-center justify-center w-screen h-screen overflow-hidden">
        <div className="absolute top-[-10%] w-[1000px] h-[1000px] opacity-[0.25] blur-[150px] rounded-full transition-colors duration-1000" style={{ backgroundColor: rankTheme.hex }} />
        <div className="absolute bottom-[-20%] w-[800px] h-[800px] opacity-[0.15] blur-[120px] rounded-full transition-colors duration-1000" style={{ backgroundColor: rankTheme.hex }} />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-sweep { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .shine-text { background: linear-gradient(90deg, transparent 0%, #fff 50%, transparent 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: shine-sweep 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }
        @keyframes idle-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes idle-pulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.08); filter: brightness(1.2); } }
        @keyframes idle-heavy { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
        @keyframes idle-shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(2deg); } 75% { transform: rotate(-2deg); } }
        @keyframes idle-titan { 0%, 100% { filter: drop-shadow(0 0 15px #22d3ee); transform: scale(1); } 50% { filter: drop-shadow(0 0 40px #22d3ee); transform: scale(1.05); } }
        @keyframes idle-god { 0%, 100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 25px #fef08a); } 50% { transform: translateY(-20px) scale(1.1); filter: drop-shadow(0 0 70px #fef08a) brightness(1.2); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}} />

      <div className="w-full flex-1 flex flex-col items-center pt-0 relative z-10 max-w-[600px] mx-auto px-6">
        <div className="relative w-full flex flex-col items-center justify-center min-h-[300px]">
          
          <span className="text-[10px] font-black uppercase text-[hsl(var(--muted))] tracking-[0.4em] block mb-8 z-10 relative">Current Standing</span>
          <div className="relative group flex items-center justify-center w-full aspect-square max-w-[220px]">
            <img src={`/ranks/${currentRank.image}`} alt={currentRank.fullName} loading="eager" className={`w-40 h-40 md:w-48 md:h-48 object-contain relative z-10 transform-gpu will-change-transform drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] ${rankTheme.anim}`} style={{ transform: 'translateZ(0)' }} />
          </div>
          <h2 className={`mt-8 text-5xl font-black uppercase tracking-tighter drop-shadow-md z-10 ${isGod ? 'bg-gradient-to-r from-[#fef08a] via-white to-[#fef08a] bg-[length:200%_auto] text-transparent bg-clip-text animate-[shimmer_3s_infinite]' : ''}`} style={!isGod ? { color: rankTheme.hex } : {}}>{currentRank.name}</h2>
          <span className="text-sm font-bold text-white/90 tracking-[0.2em] mt-2 z-10 uppercase">{currentRank.name === 'God' ? 'MAXIMUM RANK' : currentRank.tier || `LEVEL ${currentRank.tier}`}</span>
        </div>

        <div className="w-full mt-10 mb-20 relative z-10">
          <div className="w-full flex justify-between items-end mb-3 px-1">
            <span className="text-xl font-black tracking-widest drop-shadow-md" style={{ color: rankTheme.hex, textShadow: `0 0 15px ${rankTheme.hex}80` }}>{Math.floor(activePoints).toLocaleString()} PTS</span>
            <span className="text-[10px] font-bold text-[hsl(var(--muted))] uppercase tracking-widest">{currentRank.next ? `${currentRank.next.toLocaleString()} PTS` : 'UNLIMITED'}</span>
          </div>
          <div className="w-full h-[6px] bg-white/10 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <div className={`h-full rounded-r-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_currentColor] ${isGod ? 'w-full bg-gradient-to-r from-[#fef08a] to-white bg-[length:200%_auto] animate-[shimmer_2s_infinite]' : ''}`} style={!isGod ? { width: `${Math.min(100, Math.max(0, currentRank.progress))}%`, backgroundColor: rankTheme.hex } : {}}>
              {!isGod && <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center relative z-10 pb-8">
          <span className="text-[10px] font-black uppercase text-[hsl(var(--muted))] tracking-[0.4em] block mb-8">Anatomy Focus</span>
          <AnatomyModel />
        </div>
      </div>

      {selectedMuscle && (() => {
        const muscleXP = volumes[selectedMuscle] || 0;
        const details = getMuscleDetails(muscleXP);
        return (
          <div className="fixed inset-0 bg-[#09090b]/95 backdrop-blur-3xl z-[100] flex flex-col animate-in fade-in zoom-in duration-300 w-screen h-screen">
            <div className="flex-none flex items-center justify-between p-6 pt-[max(env(safe-area-inset-top),3rem)] z-10 absolute top-0 left-0">
              <button onClick={() => setSelectedMuscle(null)} className="text-[hsl(var(--muted))] hover:text-white transition-colors p-3 bg-white/5 border border-white/10 rounded-full shadow-sm backdrop-blur-md active:scale-95"><ArrowLeft size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col justify-between pt-12 pb-16 px-6 w-full max-w-[500px] mx-auto">
              
              <div className="flex flex-col items-center mt-auto mb-10">
                <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-[0.3em] mb-2">{selectedMuscle}</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-8" style={{ color: details.hex, textShadow: `0 0 15px ${details.hex}` }}>Muscle Level</span>
                
                <div className="relative flex justify-center items-center">
                  <div className="absolute w-40 h-40 opacity-30 blur-[60px] rounded-full pointer-events-none" style={{ backgroundColor: details.hex }} />
                  <span className="text-[140px] font-black leading-none tracking-tighter relative z-10" style={{ color: details.hex, textShadow: `0 0 40px ${details.hex}` }}>{details.level}</span>
                </div>
              </div>

              <div className="w-full bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl backdrop-blur-md mb-12 relative z-10">
                <div className="flex justify-between items-end mb-4 px-1 text-sm font-black uppercase tracking-widest">
                  <span style={{ color: details.hex }} className="drop-shadow-md">{Math.floor(muscleXP).toLocaleString()} XP</span>
                  <span className="text-white/40">{details.nextXP.toLocaleString()} XP</span>
                </div>
                <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div className="h-full rounded-r-full transition-all duration-1000 ease-out relative" style={{ width: `${Math.min(100, Math.max(0, details.progress))}%`, backgroundColor: details.hex, boxShadow: `0 0 20px ${details.hex}` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[300px] mx-auto relative pointer-events-none opacity-80 mt-auto">
                <AnatomyModel highlight={selectedMuscle} />
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}