/**
 * InputType vs ArgsType
 * InputType은 선언한 객체를 input으로 받기 위해서 사용함. 객체의 형을 꼭 유지한 값을 입력받을 수 있다.
 * ArgsTypedms 선언한 객체의 field들을 입력받기 위해서 사용함. 객체의 형을 유지할 필요 없이 field들을 입력받을 수 있다.
 */

import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

/**
 * old version : CreateRestaurantDto
 */
// @ArgsType()
// export class CreateRestaurantDto {
//   @Field(() => String)
//   @IsString()
//   @Length(5, 10)
//   name: string;

//   @Field(() => Boolean)
//   @IsBoolean()
//   isVegan: boolean;

//   @Field(() => String)
//   @IsString()
//   address: string;

//   @Field(() => String)
//   @IsString()
//   ownerName: string;
// }

@InputType()
export class CreateRestaurantInput extends PickType(
  Restaurant,
  ['name', 'coverImage', 'address'],
  InputType, // CreateREstaurantInputType가 InputType으로 다뤄짐. 이 값을 설정하지 않으면, Restaurnat의 타입(ObjectType)으로 설정됨
) {
  @Field(() => String)
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {
  @Field(() => Int)
  restaurantId?: number;
}
