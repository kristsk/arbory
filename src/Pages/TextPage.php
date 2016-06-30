<?php

namespace CubeSystems\Leaf\Pages;

use CubeSystems\Leaf\Fields\Text;
use CubeSystems\Leaf\FieldSet;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TextPage
 * @package CubeSystems\Leaf\Pages
 */
class TextPage extends Model implements PageInterface
{
    /**
     * @var array
     */
    protected $fillable = [ 'html' ];

    /**
     * @param FieldSet $fieldSet
     */
    public function formFields( FieldSet $fieldSet )
    {
        // TODO: Move this somewhere
        $fieldSet->add( new Text( 'html' ) );
    }

    /**
     * @return string
     */
    public function getHtml()
    {
        // TODO: replace HTML placeholders - links, images, embed, etc.
        return $this->html;
    }
}
